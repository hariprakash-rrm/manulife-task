import { Component, inject, OnInit, signal } from '@angular/core';
import { PortfolioService } from '../../services/portfolio.service';
import type { Portfolio, ChartData } from '../../../core/models/portfolio.model';
import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { PortfolioChartComponent } from '../../components/portfolio-chart/portfolio-chart.component';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home-portfolio',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, NgClass, PortfolioChartComponent],
  templateUrl: './home-portfolio.component.html',
  styleUrl: './home-portfolio.component.css'
})
export class HomePortfolioComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private toastService = inject(ToastService);

  portfolio = signal<Portfolio | null>(null);
  chartData = signal<ChartData | null>(null);
  isLoading = signal(true);
  isSeeding = signal(false);

  ngOnInit(): void {
    this.loadPortfolio();
    this.loadChartData();
  }

  loadPortfolio(): void {
    this.isLoading.set(true);
    this.portfolioService.getPortfolio(1, 10, 'ALL', '').subscribe({
      next: (p) => {
        this.portfolio.set(p);
        this.isLoading.set(false);
      },
      error: (e) => {
        console.error('Failed to load portfolio', e);
        this.toastService.showError(e.error?.message ?? 'Failed to load portfolio overview.');
        this.isLoading.set(false);
      }
    });
  }

  loadChartData(): void {
    this.portfolioService.getChartData(30).subscribe({
      next: (data) => this.chartData.set(data),
      error: () => {
        this.toastService.showError('Failed to load historical value chart.');
      },
    });
  }

  async seedRandomAssets() {
    if (this.isSeeding()) return;
    this.isSeeding.set(true);

    const assetNames = [
      { name: 'Apple Inc.', symbol: 'AAPL', type: 'STOCK' },
      { name: 'Microsoft Corporation', symbol: 'MSFT', type: 'STOCK' },
      { name: 'Alphabet Inc.', symbol: 'GOOGL', type: 'STOCK' },
      { name: 'Amazon.com Inc.', symbol: 'AMZN', type: 'STOCK' },
      { name: 'NVIDIA Corporation', symbol: 'NVDA', type: 'STOCK' },
      { name: 'Tesla Inc.', symbol: 'TSLA', type: 'STOCK' },
      { name: 'Meta Platforms Inc.', symbol: 'META', type: 'STOCK' },
      { name: 'JPMorgan Chase & Co.', symbol: 'JPM', type: 'STOCK' },
      { name: 'Berkshire Hathaway Inc.', symbol: 'BRK.A', type: 'STOCK' },
      { name: 'Eli Lilly & Co.', symbol: 'LLY', type: 'STOCK' },
      { name: 'US Treasury 10Y Bond', symbol: 'US10Y', type: 'BOND' },
      { name: 'Vanguard Total Bond Market ETF', symbol: 'BND', type: 'BOND' },
      { name: 'iShares Core US Aggregate Bond', symbol: 'AGG', type: 'BOND' },
      { name: 'Fidelity Government Income Fund', symbol: 'FGOVX', type: 'MUTUAL_FUND' },
      { name: 'Vanguard 500 Index Fund', symbol: 'VFIAX', type: 'MUTUAL_FUND' },
      { name: 'Bitcoin', symbol: 'BTC', type: 'CRYPTO' },
      { name: 'Ethereum', symbol: 'ETH', type: 'CRYPTO' },
      { name: 'Solana', symbol: 'SOL', type: 'CRYPTO' },
      { name: 'Cardano', symbol: 'ADA', type: 'CRYPTO' },
      { name: 'Ripple', symbol: 'XRP', type: 'CRYPTO' },
      { name: 'US Dollar Cash', symbol: 'USD', type: 'CASH' },
      { name: 'Euro Cash', symbol: 'EUR', type: 'CASH' }
    ];

    const count = 50;
    let successCount = 0;
    
    this.toastService.showSuccess(`Starting to seed ${count} random assets...`);
    
    for (let i = 0; i < count; i++) {
      const template = assetNames[Math.floor(Math.random() * assetNames.length)];
      const quantity = parseFloat((Math.random() * 100 + 1).toFixed(4));
      const purchasePrice = parseFloat((Math.random() * 500 + 5).toFixed(2));
      const currentPrice = parseFloat((purchasePrice * (0.85 + Math.random() * 0.3)).toFixed(2));
      
      const randomId = Math.floor(Math.random() * 900) + 100;
      const symbol = `${template.symbol}-${randomId}`;
      const name = `${template.name} #${randomId}`;

      const dto = {
        name,
        symbol: symbol.toUpperCase(),
        type: template.type as any,
        quantity,
        purchasePrice,
        currentPrice
      };

      try {
        await firstValueFrom(this.portfolioService.addAsset(dto));
        successCount++;
      } catch (err) {
        console.error('Failed to add seed asset', err);
      }
    }

    this.isSeeding.set(false);
    if (successCount > 0) {
      this.toastService.showSuccess(`Successfully seeded ${successCount} random assets!`);
      this.loadPortfolio();
      this.loadChartData();
    } else {
      this.toastService.showError('Failed to seed random assets.');
    }
  }
}
