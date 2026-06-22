import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionsComponent } from './transactions.component';
import { PortfolioService } from '../../services/portfolio.service';
import { of } from 'rxjs';

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;

  const mockPortfolioService = {
    getTransactions: vi.fn().mockReturnValue(of({
      transactions: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsComponent],
      providers: [
        { provide: PortfolioService, useValue: mockPortfolioService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile and render transaction container', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Transaction Activity');
  });
});
