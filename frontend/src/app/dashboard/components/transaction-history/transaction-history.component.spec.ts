import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionHistoryComponent } from './transaction-history.component';
import { PortfolioService } from '../../services/portfolio.service';
import { of, throwError } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';

describe('TransactionHistoryComponent', () => {
  let component: TransactionHistoryComponent;
  let fixture: ComponentFixture<TransactionHistoryComponent>;

  const mockPortfolioService = {
    getTransactions: vi.fn().mockReturnValue(of({
      transactions: [
        {
          _id: 't1',
          userId: 'u1',
          assetId: 'a1',
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          transactionType: 'BUY',
          quantity: 2,
          price: 250,
          totalValue: 500,
          createdAt: new Date().toISOString()
        }
      ],
      total: 1,
      page: 1,
      limit: 15,
      hasMore: false
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionHistoryComponent],
      providers: [
        { provide: PortfolioService, useValue: mockPortfolioService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionHistoryComponent);
    component = fixture.componentInstance;

    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.IntersectionObserver = MockIntersectionObserver as any;

    fixture.detectChanges();
  });

  it('should compile and render transactions in list', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('TSLA');
    expect(compiled.textContent).toContain('Tesla Inc.');
  });

  it('should change viewMode and call load with reset', () => {
    mockPortfolioService.getTransactions.mockClear();
    component.setViewMode('paginate');
    expect(component.viewMode()).toBe('paginate');
    expect(mockPortfolioService.getTransactions).toHaveBeenCalledWith(1, 10);
  });

  it('should load more transactions when loadMore is called in scroll mode', () => {
    mockPortfolioService.getTransactions.mockClear();
    component.viewMode.set('scroll');
    component.isLoading.set(false);
    component.isLoadingMore.set(false);
    component.hasMore.set(true);
    component.page.set(1);

    component.loadMore();

    expect(component.page()).toBe(2);
    expect(mockPortfolioService.getTransactions).toHaveBeenCalledWith(2, 15);
  });

  it('should show formatted error message on toast when transactions fetch fails', () => {
    const toastService = TestBed.inject(ToastService);
    const toastSpy = vi.spyOn(toastService, 'showError');

    const errorResponse = {
      status: 400,
      error: { message: ['Failed to load transaction logs due to db issue'] }
    };
    mockPortfolioService.getTransactions.mockReturnValueOnce(throwError(() => errorResponse));

    component.load(true);

    expect(toastSpy).toHaveBeenCalledWith(['Failed to load transaction logs due to db issue']);
  });
});
