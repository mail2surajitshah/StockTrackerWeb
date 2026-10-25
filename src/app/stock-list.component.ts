import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Stock } from './stock.model';
import { StockService } from './stock.service';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './stock-list.component.html',
  styleUrl: './stock-list.component.css'
})
export class StockListComponent implements OnInit {
  private service = inject(StockService);
  private fb = inject(FormBuilder);

  stocks = signal<Stock[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  editingId = signal<number | null>(null);

  form = this.fb.nonNullable.group({
    symbol: ['', [Validators.required, Validators.maxLength(10)]],
    name: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => { this.stocks.set(data); this.loading.set(false); },
      error: () => { this.error.set('Could not load stocks. Is the API running?'); this.loading.set(false); }
    });
  }

  edit(stock: Stock): void {
    this.editingId.set(stock.id);
    this.form.setValue({
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity,
      price: stock.price
    });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ symbol: '', name: '', quantity: 0, price: 0 });
  }

    save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const id = this.editingId();

    const onSuccess = () => { this.cancel(); this.load(); };
    const onError = () => this.error.set('Save failed. Please check the values and try again.');

    if (id === null) {
      this.service.create(value).subscribe({ next: onSuccess, error: onError });
    } else {
      this.service.update({ id, ...value }).subscribe({ next: onSuccess, error: onError });
    }
  }

  remove(stock: Stock): void {
    if (!confirm(`Delete ${stock.symbol}?`)) return;
    this.service.delete(stock.id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Delete failed.')
    });
  }
}
