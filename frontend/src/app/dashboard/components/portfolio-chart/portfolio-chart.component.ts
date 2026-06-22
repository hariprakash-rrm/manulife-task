import {
  Component, Input, OnChanges, OnDestroy,
  ViewChild, ElementRef, SimpleChanges,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  Chart, ChartConfiguration, ArcElement, DoughnutController,
  LineController, LineElement, PointElement, LinearScale,
  CategoryScale, Tooltip, Legend, Filler,
} from 'chart.js';
import type { Asset, ChartData } from '../../../core/models/portfolio.model';

Chart.register(
  ArcElement, DoughnutController, LineController, LineElement,
  PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler,
);

const TYPE_COLORS: Record<string, string> = {
  STOCK: '#6366f1',
  BOND: '#10b981',
  MUTUAL_FUND: '#3b82f6',
  CRYPTO: '#f59e0b',
  CASH: '#64748b',
};

@Component({
  selector: 'app-portfolio-chart',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './portfolio-chart.component.html',
  styleUrl: './portfolio-chart.component.css'
})
export class PortfolioChartComponent implements OnChanges, OnDestroy {
  @Input() assets: Asset[] = [];
  @Input() chartData: ChartData | null = null;

  private donutCanvasEl: HTMLCanvasElement | null = null;
  private lineCanvasEl: HTMLCanvasElement | null = null;

  @ViewChild('donutCanvas') set donutCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref) {
      this.donutCanvasEl = ref.nativeElement;
      this.renderDonut();
    } else {
      this.donutCanvasEl = null;
      this.donutChart?.destroy();
      this.donutChart = null;
    }
  }

  @ViewChild('lineCanvas') set lineCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref) {
      this.lineCanvasEl = ref.nativeElement;
      this.renderLine();
    } else {
      this.lineCanvasEl = null;
      this.lineChart?.destroy();
      this.lineChart = null;
    }
  }

  private donutChart: Chart | null = null;
  private lineChart: Chart | null = null;

  get totalValue(): number {
    return this.assets.reduce((sum, a) => sum + a.totalValue, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assets']) {
      this.renderDonut();
    }
    if (changes['chartData']) {
      this.renderLine();
    }
  }

  ngOnDestroy() {
    this.donutChart?.destroy();
    this.lineChart?.destroy();
  }

  private renderDonut() {
    if (!this.donutCanvasEl) return;
    this.donutChart?.destroy();

    const byType: Record<string, number> = {};
    for (const a of this.assets) {
      byType[a.type] = (byType[a.type] ?? 0) + a.totalValue;
    }

    const labels = Object.keys(byType);
    const data = Object.values(byType);

    if (!labels.length) {
      this.donutChart = null;
      return;
    }

    const cfg: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map((l) => TYPE_COLORS[l] ?? '#94a3b8'),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'bottom', 
            labels: { 
              color: '#64748b', 
              padding: 16, 
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 12, family: 'Inter, sans-serif', weight: 'normal' } 
            } 
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: 'Inter, sans-serif', size: 13, weight: 'bold' },
            bodyFont: { family: 'Inter, sans-serif', size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = ((ctx.raw as number) / total * 100).toFixed(1);
                return ` ${ctx.label}: $${(ctx.raw as number).toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
        cutout: '75%',
      },
    };

    this.donutChart = new Chart(this.donutCanvasEl, cfg);
  }

  private renderLine() {
    if (!this.lineCanvasEl || !this.chartData) return;
    this.lineChart?.destroy();

    const { labels, values, costs } = this.chartData;
    if (!labels.length) return;

    let backgroundColor: any = 'rgba(99,102,241,0.05)';
    try {
      const ctx = this.lineCanvasEl.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');
        backgroundColor = gradient;
      }
    } catch (e) {
      console.warn('Could not create line chart gradient', e);
    }

    const cfg: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Portfolio Value',
            data: values,
            borderColor: '#6366f1',
            borderWidth: 3,
            backgroundColor,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
          },
          {
            label: 'Total Cost',
            data: costs,
            borderColor: '#10b981',
            borderWidth: 2,
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            borderDash: [6, 6],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'top',
            align: 'end',
            labels: { 
              color: '#64748b', 
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 12, family: 'Inter, sans-serif', weight: 'normal' } 
            } 
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: 'Inter, sans-serif', size: 13, weight: 'bold' },
            bodyFont: { family: 'Inter, sans-serif', size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: $${(ctx.raw as number).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: { 
            ticks: { 
              color: '#94a3b8', 
              maxTicksLimit: 8,
              font: { family: 'Inter, sans-serif', size: 11 }
            }, 
            grid: { 
              display: false
            } 
          },
          y: {
            ticks: { 
              color: '#94a3b8', 
              callback: (v) => `$${Number(v).toLocaleString()}`,
              font: { family: 'Inter, sans-serif', size: 11 }
            },
            grid: { 
              color: 'rgba(241, 245, 249, 0.8)',
            },
          },
        },
      },
    };

    this.lineChart = new Chart(this.lineCanvasEl, cfg);
  }
}
