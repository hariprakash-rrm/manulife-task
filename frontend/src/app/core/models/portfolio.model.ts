export type AssetType = 'STOCK' | 'BOND' | 'MUTUAL_FUND' | 'CRYPTO' | 'CASH';
export type TransactionType = 'BUY' | 'SELL' | 'UPDATE';

export interface Asset {
  _id: string;
  name: string;
  symbol: string;
  type: AssetType;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  performancePercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalReturnPercentage: number;
}

export interface Portfolio {
  _id: string;
  userId: string;
  assets: Asset[];
  hasMore: boolean;
  summary: PortfolioSummary;
}

export interface AddAssetDto {
  name: string;
  symbol: string;
  type: AssetType;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}

export type UpdateAssetDto = Partial<AddAssetDto>;

export interface Transaction {
  _id: string;
  assetId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  transactionType: TransactionType;
  quantity: number;
  price: number;
  totalValue: number;
  createdAt: string;
}

export interface TransactionPage {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ChartData {
  labels: string[];
  values: number[];
  costs: number[];
}
