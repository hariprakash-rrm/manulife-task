import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, computed } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { PortfolioService } from '../../services/portfolio.service';
import type { Transaction } from '../../../core/models/portfolio.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, NgClass],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.css'
})
export class TransactionHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private portfolioService = inject(PortfolioService);
  private toastService = inject(ToastService);

  // View state signals
  viewMode = signal<'scroll' | 'paginate'>('scroll');
  transactions = signal<Transaction[]>([]);
  isLoading = signal(true);
  hasMore = signal(false);
  page = signal(1);
  pageSize = signal(10);
  totalTransactions = signal(0);
  isLoadingMore = signal(false);

  // Computeds for pagination description
  totalPages = computed(() => Math.ceil(this.totalTransactions() / this.pageSize()) || 1);
  
  showingStart = computed(() => {
    if (this.transactions().length === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  showingEnd = computed(() => {
    return Math.min(this.page() * this.pageSize(), this.totalTransactions());
  });

  // Infinite Scroll Intersection Observer
  @ViewChild('observerTarget') observerTarget?: ElementRef;
  private observer?: IntersectionObserver;

  ngOnInit() {
    this.load(true);
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  load(reset = false) {
    if (reset) {
      this.page.set(1);
      this.isLoading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }

    const currentLimit = this.viewMode() === 'scroll' ? 15 : this.pageSize();

    this.portfolioService.getTransactions(this.page(), currentLimit).subscribe({
      next: (res) => {
        if (reset) {
          this.transactions.set(res.transactions);
        } else {
          this.transactions.update((t) => [...t, ...res.transactions]);
        }
        this.totalTransactions.set(res.total || 0);
        this.hasMore.set(res.hasMore);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (e) => {
        this.toastService.showError(e.error?.message ?? 'Failed to load transaction history.');
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
    });
  }

  setViewMode(mode: 'scroll' | 'paginate') {
    if (this.viewMode() === mode) return;
    this.viewMode.set(mode);
    this.load(true);
  }

  setPageSize(size: number) {
    const parsed = Number(size);
    if (this.pageSize() === parsed) return;
    this.pageSize.set(parsed);
    this.load(true);
  }

  loadMore() {
    if (this.isLoading() || this.isLoadingMore() || !this.hasMore()) return;
    this.page.update((p) => p + 1);
    this.load(false);
  }

  prevPage() {
    if (this.page() <= 1 || this.isLoading()) return;
    this.page.update((p) => p - 1);
    this.load(true);
  }

  nextPage() {
    if (!this.hasMore() || this.isLoading()) return;
    this.page.update((p) => p + 1);
    this.load(true);
  }

  private setupIntersectionObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && this.viewMode() === 'scroll' && this.hasMore() && !this.isLoading() && !this.isLoadingMore()) {
          this.loadMore();
        }
      },
      { rootMargin: '100px' }
    );

    if (this.observerTarget) {
      this.observer.observe(this.observerTarget.nativeElement);
    }
  }
}
