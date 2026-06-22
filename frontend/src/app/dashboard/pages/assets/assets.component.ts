import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { PortfolioService } from '../../services/portfolio.service';
import type { Portfolio, AssetType, Asset } from '../../../core/models/portfolio.model';
import { CurrencyPipe, DecimalPipe, NgClass, LowerCasePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, NgClass],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.css'
})
export class AssetsComponent implements OnInit, AfterViewInit, OnDestroy {
  private portfolioService = inject(PortfolioService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  @ViewChild('observerTarget') observerTarget!: ElementRef;
  private observer: IntersectionObserver | null = null;

  portfolio = signal<Portfolio | null>(null);
  
  // Filter State
  searchControl = new FormControl('');
  typeControl = new FormControl('ALL');
  private filterSub!: Subscription;

  // Pagination State
  loadedAssets = signal<Asset[]>([]);
  page = signal(1);
  hasMore = signal(false);
  isLoading = signal(true);
  isLoadingMore = signal(false);

  // Add/Edit Form State
  showAddForm = signal(false);
  editingAssetId = signal<string | null>(null);
  isSaving = signal(false);
  assetTypes: AssetType[] = ['STOCK', 'BOND', 'MUTUAL_FUND', 'CRYPTO', 'CASH'];
  
  addForm = this.fb.group({
    name: ['', Validators.required],
    symbol: ['', Validators.required],
    type: ['STOCK' as AssetType, Validators.required],
    quantity: [0, [Validators.required, Validators.min(0.000001)]],
    purchasePrice: [0, [Validators.required, Validators.min(0)]],
    currentPrice: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.loadPortfolio(true);

    // Setup filter subscriptions
    this.filterSub = new Subscription();
    
    this.filterSub.add(
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => this.loadPortfolio(true))
    );

    this.filterSub.add(
      this.typeControl.valueChanges.subscribe(() => this.loadPortfolio(true))
    );
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasMore() && !this.isLoading() && !this.isLoadingMore()) {
        this.loadMore();
      }
    }, { rootMargin: '100px' });

    if (this.observerTarget) {
      this.observer.observe(this.observerTarget.nativeElement);
    }
  }

  loadPortfolio(reset = false) {
    if (reset) {
      this.isLoading.set(true);
      this.page.set(1);
      this.loadedAssets.set([]);
    } else {
      this.isLoadingMore.set(true);
    }

    const type = this.typeControl.value || 'ALL';
    const search = this.searchControl.value || '';

    this.portfolioService.getPortfolio(this.page(), 10, type, search).subscribe({
      next: (p) => {
        this.portfolio.set(p);
        
        if (reset) {
          this.loadedAssets.set(p.assets);
        } else {
          this.loadedAssets.update(assets => [...assets, ...p.assets]);
        }

        this.hasMore.set(p.hasMore);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (e) => {
        console.error('Failed to load portfolio', e);
        this.toastService.showError(e.error?.message ?? 'Failed to load portfolio assets.');
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  loadMore() {
    this.page.update(p => p + 1);
    this.loadPortfolio(false);
  }

  toggleAddForm() {
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) {
      this.editingAssetId.set(null);
      this.addForm.reset({ type: 'STOCK', quantity: 0, purchasePrice: 0, currentPrice: 0 });
    }
  }

  cancelEdit() {
    this.editingAssetId.set(null);
    this.addForm.reset({ type: 'STOCK', quantity: 0, purchasePrice: 0, currentPrice: 0 });
  }

  editAsset(asset: Asset) {
    this.editingAssetId.set(asset._id);
    this.addForm.patchValue({
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type,
      quantity: asset.quantity,
      purchasePrice: asset.purchasePrice,
      currentPrice: asset.currentPrice
    });
    this.showAddForm.set(false);
  }

  saveAsset() {
    if (this.addForm.invalid || this.isSaving()) return;
    
    const editId = this.editingAssetId();
    if (editId) {
      if (!confirm('Are you sure you want to apply these changes?')) {
        return;
      }
    }

    this.isSaving.set(true);
    const val = this.addForm.value;
    const dto = {
      name: val.name!,
      symbol: val.symbol!.toUpperCase(),
      type: val.type as AssetType,
      quantity: Number(val.quantity),
      purchasePrice: Number(val.purchasePrice),
      currentPrice: Number(val.currentPrice),
    };

    const request$ = editId 
      ? this.portfolioService.updateAsset(editId, dto)
      : this.portfolioService.addAsset(dto);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.showSuccess(editId ? 'Asset updated successfully!' : 'Asset added successfully!');
        this.loadPortfolio(true);
        if (editId) {
          this.cancelEdit();
        } else {
          this.toggleAddForm();
        }
      },
      error: (e) => {
        console.error(e);
        this.toastService.showError(e.error?.message ?? 'Failed to save asset.');
        this.isSaving.set(false);
      }
    });
  }


  async sellAndRemoveAsset() {
    const editId = this.editingAssetId();
    if (!editId || this.addForm.invalid || this.isSaving()) return;

    if (!confirm('Are you sure you want to sell and remove this asset? This will record a SELL transaction at the specified current price.')) {
      return;
    }

    this.isSaving.set(true);
    const val = this.addForm.value;
    const dto = {
      name: val.name!,
      symbol: val.symbol!.toUpperCase(),
      type: val.type as AssetType,
      quantity: Number(val.quantity),
      purchasePrice: Number(val.purchasePrice),
      currentPrice: Number(val.currentPrice),
    };

    // 1. Update the asset first to save the custom price (acting as sale price)
    this.portfolioService.updateAsset(editId, dto).subscribe({
      next: () => {
        // 2. Remove the asset to trigger a SELL transaction with the updated price
        this.portfolioService.deleteAsset(editId).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.toastService.showSuccess('Asset sold and removed successfully!');
            this.loadPortfolio(true);
            this.cancelEdit();
          },
          error: (e) => {
            console.error(e);
            this.toastService.showError(e.error?.message ?? 'Failed to remove asset.');
            this.isSaving.set(false);
          }
        });
      },
      error: (e) => {
        console.error(e);
        this.toastService.showError(e.error?.message ?? 'Failed to update asset before selling.');
        this.isSaving.set(false);
      }
    });
  }

  deleteAsset(assetId: string) {
    if(confirm('Are you sure you want to remove this asset?')) {
      this.portfolioService.deleteAsset(assetId).subscribe({
        next: () => {
          this.toastService.showSuccess('Asset removed successfully!');
          this.loadPortfolio(true);
        },
        error: (e) => {
          console.error(e);
          this.toastService.showError(e.error?.message ?? 'Failed to remove asset.');
        }
      });
    }
  }
}
