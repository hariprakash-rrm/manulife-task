import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Portfolio, AddAssetDto, TransactionPage, ChartData } from '../../core/models/portfolio.model';

const API = '/api/portfolios';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private http = inject(HttpClient);

  getPortfolio(page = 1, limit = 10, type = 'ALL', search = ''): Observable<Portfolio> {
    let url = `${API}?page=${page}&limit=${limit}`;
    if (type !== 'ALL') url += `&type=${type}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<Portfolio>(url);
  }

  getTransactions(page = 1, limit = 20): Observable<TransactionPage> {
    return this.http.get<TransactionPage>(`${API}/transactions?page=${page}&limit=${limit}`);
  }

  getChartData(limit = 30): Observable<ChartData> {
    return this.http.get<ChartData>(`${API}/chart?limit=${limit}`);
  }

  addAsset(asset: AddAssetDto): Observable<Portfolio> {
    return this.http.post<Portfolio>(`${API}/assets`, asset);
  }

  updateAsset(assetId: string, asset: Partial<AddAssetDto>): Observable<Portfolio> {
    return this.http.put<Portfolio>(`${API}/assets/${assetId}`, asset);
  }

  deleteAsset(assetId: string): Observable<Portfolio> {
    return this.http.delete<Portfolio>(`${API}/assets/${assetId}`);
  }
}
