
import { Routes } from '@angular/router';
import { StockListComponent } from './stock-list.component';
import { StockImportComponent } from './stock-import.component';

export const routes: Routes = [
  { path: '', component: StockListComponent },
  { path: 'import', component: StockImportComponent },
  { path: '**', redirectTo: '' }
];

