import { Component } from '@angular/core';
import { TransactionHistoryComponent } from '../../components/transaction-history/transaction-history.component';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [TransactionHistoryComponent],
  template: `
    <div class="header-actions">
      <div>
        <h2>Transaction Activity</h2>
        <p class="subtitle">View transaction history and logs</p>
      </div>
    </div>
    <app-transaction-history />
  `,
  styles: [`
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;

      h2 { font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem; }
      .subtitle { color: var(--color-muted); font-size: 1rem; }
    }
  `]
})
export class TransactionsComponent {}
