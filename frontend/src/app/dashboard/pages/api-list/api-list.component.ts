import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-api-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-list.component.html',
})
export class ApiListComponent {
  apis: any[] = [
    {
      module: 'Auth',
      endpoints: [
        {
          method: 'POST',
          path: '/auth/register',
          description: 'Register a new user',
          request: { body: { email: 'user@example.com', password: 'Password123!', firstName: 'John', lastName: 'Doe' } },
          response: { message: 'User successfully registered' }
        },
        {
          method: 'POST',
          path: '/auth/login',
          description: 'Login an existing user',
          request: { body: { email: 'user@example.com', password: 'Password123!' } },
          response: { accessToken: 'jwt_token', refreshToken: 'jwt_refresh_token', user: { id: 'uuid', email: 'user@example.com' } }
        },
        {
          method: 'POST',
          path: '/auth/refresh',
          description: 'Refresh access token',
          request: { headers: { Authorization: 'Bearer {refreshToken}' } },
          response: { accessToken: 'new_jwt_token', refreshToken: 'new_jwt_refresh_token' }
        },
        {
          method: 'POST',
          path: '/auth/logout',
          description: 'Logout user',
          request: { headers: { Authorization: 'Bearer {accessToken}' } },
          response: { message: 'Logged out successfully' }
        },
        {
          method: 'GET',
          path: '/auth/me',
          description: 'Get current user profile',
          request: { headers: { Authorization: 'Bearer {accessToken}' } },
          response: { id: 'uuid', email: 'user@example.com', role: 'USER' }
        }
      ]
    },
    {
      module: 'Portfolios',
      endpoints: [
        {
          method: 'GET',
          path: '/portfolios',
          description: 'Get user portfolio summary and asset list',
          request: { query: { page: 1, limit: 10, type: 'STOCK', search: 'AAPL' } },
          response: { totalValue: 10000, dailyChange: 150, dailyChangePercentage: 1.5, assets: [], pagination: { total: 1, page: 1, limit: 10 } }
        },
        {
          method: 'GET',
          path: '/portfolios/transactions',
          description: 'Get user transaction history',
          request: { query: { page: 1, limit: 20 } },
          response: { transactions: [], pagination: { total: 10, page: 1, limit: 20 } }
        },
        {
          method: 'GET',
          path: '/portfolios/chart',
          description: 'Get portfolio historical chart data',
          request: { query: { limit: 30 } },
          response: [{ date: '2023-10-01', value: 9500 }, { date: '2023-10-02', value: 9800 }]
        },
        {
          method: 'POST',
          path: '/portfolios/assets',
          description: 'Add a new asset to portfolio',
          request: { body: { symbol: 'AAPL', type: 'STOCK', shares: 10, averagePrice: 150 } },
          response: { id: 'uuid', symbol: 'AAPL', type: 'STOCK', shares: 10, averagePrice: 150, currentValue: 1550 }
        },
        {
          method: 'PUT',
          path: '/portfolios/assets/:id',
          description: 'Update an existing asset',
          request: { path: { id: 'uuid' }, body: { shares: 15, averagePrice: 152 } },
          response: { id: 'uuid', symbol: 'AAPL', shares: 15, averagePrice: 152 }
        },
        {
          method: 'DELETE',
          path: '/portfolios/assets/:id',
          description: 'Remove an asset from portfolio',
          request: { path: { id: 'uuid' } },
          response: { message: 'Asset removed successfully' }
        }
      ]
    }
  ];

  getMethodClass(method: string): string {
    switch(method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}
