import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePortfolioComponent } from './home-portfolio.component';
import { PortfolioService } from '../../services/portfolio.service';
import { of } from 'rxjs';

describe('HomePortfolioComponent', () => {
  let component: HomePortfolioComponent;
  let fixture: ComponentFixture<HomePortfolioComponent>;

  const mockPortfolioService = {
    getPortfolio: vi.fn().mockReturnValue(of({
      _id: '123',
      userId: '1',
      assets: [],
      hasMore: false,
      summary: {
        totalValue: 1250,
        totalCost: 1000,
        totalReturnPercentage: 25
      }
    })),
    getChartData: vi.fn().mockReturnValue(of({
      labels: [],
      values: [],
      costs: []
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePortfolioComponent],
      providers: [
        { provide: PortfolioService, useValue: mockPortfolioService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render summary metrics', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1,250.00'); // Total Value
    expect(compiled.textContent).toContain('25.00%'); // Return
  });
});
