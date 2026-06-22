import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetsComponent } from './assets.component';
import { PortfolioService } from '../../services/portfolio.service';
import { of, throwError } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';

describe('AssetsComponent', () => {
  let component: AssetsComponent;
  let fixture: ComponentFixture<AssetsComponent>;

  const mockPortfolioService = {
    getPortfolio: vi.fn().mockReturnValue(of({
      _id: '123',
      userId: '1',
      assets: [
        {
          _id: 'a1',
          name: 'Tesla',
          symbol: 'TSLA',
          type: 'STOCK',
          quantity: 5,
          purchasePrice: 200,
          currentPrice: 250,
          totalValue: 1250,
          totalCost: 1000,
          performancePercentage: 25
        }
      ],
      hasMore: false,
      summary: {
        totalValue: 1250,
        totalCost: 1000,
        totalReturnPercentage: 25
      }
    })),
    addAsset: vi.fn().mockReturnValue(of({})),
    updateAsset: vi.fn().mockReturnValue(of({})),
    deleteAsset: vi.fn().mockReturnValue(of({}))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsComponent],
      providers: [
        { provide: PortfolioService, useValue: mockPortfolioService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssetsComponent);
    component = fixture.componentInstance;

    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.IntersectionObserver = MockIntersectionObserver as any;

    fixture.detectChanges();
  });

  it('should render the asset list', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('TSLA');
    expect(compiled.textContent).toContain('Tesla');
  });

  it('should toggle add form and call addAsset on submit', () => {
    component.isLoading.set(false);
    fixture.detectChanges();

    component.toggleAddForm();
    fixture.detectChanges();
    expect(component.showAddForm()).toBe(true);

    component.addForm.patchValue({
      name: 'Apple',
      symbol: 'AAPL',
      type: 'STOCK',
      quantity: 10,
      purchasePrice: 150,
      currentPrice: 160
    });

    component.saveAsset();
    expect(mockPortfolioService.addAsset).toHaveBeenCalled();
  });

  it('should reload portfolio when filters change', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.typeControl.setValue('STOCK');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockPortfolioService.getPortfolio).toHaveBeenCalledWith(1, 10, 'STOCK', '');
  });

  it('should increment page and fetch more assets when loadMore is called', () => {
    component.hasMore.set(true);
    component.isLoading.set(false);
    component.isLoadingMore.set(false);
    component.page.set(1);

    component.loadMore();

    expect(component.page()).toBe(2);
    expect(mockPortfolioService.getPortfolio).toHaveBeenCalledWith(2, 10, 'ALL', '');
  });

  it('should show formatted error message on toast when portfolio fetch fails', () => {
    const toastService = TestBed.inject(ToastService);
    const toastSpy = vi.spyOn(toastService, 'showError');

    const errorResponse = {
      status: 400,
      error: { message: ['Quantity must be positive', 'Symbol cannot be empty'] }
    };
    mockPortfolioService.getPortfolio.mockReturnValueOnce(throwError(() => errorResponse));

    component.loadPortfolio(true);

    expect(toastSpy).toHaveBeenCalledWith(['Quantity must be positive', 'Symbol cannot be empty']);
  });
});
