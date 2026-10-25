import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stock } from '../app/stock.model';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/stocks`;

  getAll(): Observable<Stock[]> {
    return this.http.get<Stock[]>(this.baseUrl);
  }

  getById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.baseUrl}/${id}`);
  }

  create(stock: Omit<Stock, 'id'>): Observable<Stock> {
    return this.http.post<Stock>(this.baseUrl, stock);
  }

  update(stock: Stock): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${stock.id}`, stock);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
