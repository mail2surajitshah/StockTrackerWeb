import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { StockService } from './stock.service';
import { StockUpdate } from './stock-update.model';

interface RowError {
  row: number;
  message: string;
}

// Normalised header name -> name shown to the user
const REQUIRED_COLUMNS: Record<string, string> = {
  id: 'id',
  price: 'price',
  changepercent: 'changePercent',
  companyname: 'companyName'
};

@Component({
  selector: 'app-stock-import',
  standalone: true,
  templateUrl: './stock-import.component.html',
  styleUrl: './stock-import.component.css'
})
export class StockImportComponent {
  private service = inject(StockService);

  readonly previewLimit = 50;

  fileName = signal<string | null>(null);
  parsing = signal(false);
  fileError = signal<string | null>(null);
  items = signal<StockUpdate[]>([]);
  errors = signal<RowError[]>([]);

  submitting = signal(false);
  result = signal<string | null>(null);
  submitError = signal<string | null>(null);

  preview = computed(() => this.items().slice(0, this.previewLimit));
  canSubmit = computed(
    () => this.items().length > 0 && this.errors().length === 0 && !this.submitting() && !this.parsing()
  );

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // lets the user pick the same file again after fixing it
    this.reset();
    if (!file) return;

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      this.fileError.set('Please choose an .xlsx, .xls or .csv file.');
      return;
    }

    this.fileName.set(file.name);
    this.parsing.set(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        this.fileError.set('The workbook has no sheets.');
        return;
      }
      // header: 1 -> array of arrays (first row = headers); defval keeps empty cells as null
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });
      this.processRows(rows);
    } catch {
      this.fileError.set('Could not read the file. Make sure it is a valid Excel or CSV file.');
    } finally {
      this.parsing.set(false);
    }
  }

  submit(): void {
    if (!this.canSubmit()) return;

    const payload = this.items();
    this.submitting.set(true);
    this.result.set(null);
    this.submitError.set(null);

    this.service.bulkUpdate(payload).subscribe({
      next: () => {
        this.result.set(`${payload.length} stock record(s) updated.`);
        this.submitting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.submitError.set(
          err.status === 0
            ? 'Could not reach the API. Is it running?'
            : `Update failed (HTTP ${err.status}). Nothing was confirmed as saved.`
        );
        this.submitting.set(false);
      }
    });
  }

  private reset(): void {
    this.fileName.set(null);
    this.fileError.set(null);
    this.items.set([]);
    this.errors.set([]);
    this.result.set(null);
    this.submitError.set(null);
  }

  private processRows(rows: unknown[][]): void {
    if (rows.length === 0) {
      this.fileError.set('The first sheet is empty.');
      return;
    }

    // Header row: match columns by name, ignoring case, spaces and punctuation
    const headers = rows[0].map(h => this.normalise(h));
    const col: Record<string, number> = {};
    const missing: string[] = [];
    for (const key of Object.keys(REQUIRED_COLUMNS)) {
      const index = headers.indexOf(key);
      if (index < 0) missing.push(REQUIRED_COLUMNS[key]);
      else col[key] = index;
    }
    if (missing.length > 0) {
      this.fileError.set(
        `Missing column(s): ${missing.join(', ')}. The first row must contain: id, price, changePercent, companyName.`
      );
      return;
    }

    const items: StockUpdate[] = [];
    const errors: RowError[] = [];
    const seenIds = new Map<number, number>(); // id -> first row number

    rows.slice(1).forEach((r, i) => {
      const rowNo = i + 2; // Excel row number (row 1 is the header)
      if (r.every(c => c === null || c === undefined || String(c).trim() === '')) return;

      const id = this.toNumber(r[col['id']]);
      const price = this.toNumber(r[col['price']]);
      const changePercent = this.toNumber(r[col['changepercent']]);
      const companyName = String(r[col['companyname']] ?? '').trim();

      const problems: string[] = [];
      if (id === null || !Number.isInteger(id)) problems.push('id must be a whole number');
      if (price === null) problems.push('price must be a number');
      if (changePercent === null) problems.push('changePercent must be a number');
      if (!companyName) problems.push('companyName is required');

      if (id !== null && Number.isInteger(id)) {
        const firstRow = seenIds.get(id);
        if (firstRow !== undefined) problems.push(`duplicate id (first seen on row ${firstRow})`);
        else seenIds.set(id, rowNo);
      }

      if (problems.length > 0) {
        errors.push({ row: rowNo, message: problems.join('; ') });
      } else {
        items.push({
          id: id as number,
          price: price as number,
          changePercent: changePercent as number,
          companyName
        });
      }
    });

    if (items.length === 0 && errors.length === 0) {
      this.fileError.set('No data rows found below the header row.');
      return;
    }

    this.items.set(items);
    this.errors.set(errors);
  }

  private normalise(value: unknown): string {
    return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const s = value.replace('%', '').replace(/\s/g, '').replace(',', '.');
      if (s === '') return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }
}
