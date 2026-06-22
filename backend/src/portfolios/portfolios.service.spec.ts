import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { PortfoliosService } from './portfolios.service';
import { Portfolio } from './schemas/portfolio.schema';
import { Transaction } from './schemas/transaction.schema';
import { PortfolioSnapshot } from './schemas/snapshot.schema';
import { RedisService } from '../common/redis/redis.service';

const USER_ID   = '507f1f77bcf86cd799439011';
const ASSET_ID  = '507f1f77bcf86cd799439012';
const ASSET_ID2 = '507f1f77bcf86cd799439014';

const mockAsset = {
  _id: { toString: () => ASSET_ID },
  name: 'Apple Inc.',
  symbol: 'AAPL',
  type: 'STOCK',
  quantity: 10,
  purchasePrice: 150,
  currentPrice: 175,
  toObject: () => ({
    _id: ASSET_ID,
    name: 'Apple Inc.',
    symbol: 'AAPL',
    type: 'STOCK',
    quantity: 10,
    purchasePrice: 150,
    currentPrice: 175,
  }),
};

const mockPortfolio = {
  _id: '507f1f77bcf86cd799439013',
  userId: USER_ID,
  assets: [mockAsset],
};

const mockPortfolioModel = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
};

const mockTransactionModel = {
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
};

const mockSnapshotModel = {
  create: jest.fn(),
  find: jest.fn(),
};

const mockRedisService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delByPattern: jest.fn().mockResolvedValue(undefined),
};

describe('PortfoliosService', () => {
  let service: PortfoliosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfoliosService,
        { provide: getModelToken(Portfolio.name), useValue: mockPortfolioModel },
        { provide: getModelToken(Transaction.name), useValue: mockTransactionModel },
        { provide: getModelToken(PortfolioSnapshot.name), useValue: mockSnapshotModel },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<PortfoliosService>(PortfoliosService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getPortfolio ───────────────────────────────────────────
  describe('getPortfolio', () => {
    it('creates an empty portfolio when none exists', async () => {
      mockPortfolioModel.findOne.mockResolvedValue(null);
      mockPortfolioModel.create.mockResolvedValue({ ...mockPortfolio, assets: [] });

      const result = await service.getPortfolio(USER_ID);
      expect(mockPortfolioModel.create).toHaveBeenCalled();
      expect(result.assets).toHaveLength(0);
    });

    it('returns portfolio with computed summary metrics', async () => {
      mockPortfolioModel.findOne.mockResolvedValue(mockPortfolio);

      const result = await service.getPortfolio(USER_ID);

      expect(result.summary.totalValue).toBe(1750);  // 10 * 175
      expect(result.summary.totalCost).toBe(1500);   // 10 * 150
      expect(result.summary.totalReturnPercentage).toBeCloseTo(16.67, 1);
    });

    it('filters assets by type', async () => {
      mockPortfolioModel.findOne.mockResolvedValue({
        ...mockPortfolio,
        assets: [
          { ...mockAsset, type: 'STOCK', toObject: () => ({ ...mockAsset._id, type: 'STOCK' }) },
          { ...mockAsset, _id: { toString: () => ASSET_ID2 }, type: 'BOND', toObject: () => ({ type: 'BOND' }) },
        ],
      });

      const result = await service.getPortfolio(USER_ID, 1, 10, 'BOND');
      expect(result.assets.every((a: any) => a.type === 'BOND')).toBe(true);
    });

    it('filters assets by search query', async () => {
      mockPortfolioModel.findOne.mockResolvedValue(mockPortfolio);
      const result = await service.getPortfolio(USER_ID, 1, 10, undefined, 'aapl');
      expect(result.assets.length).toBe(1);
    });

    it('returns empty for non-matching search', async () => {
      mockPortfolioModel.findOne.mockResolvedValue(mockPortfolio);
      const result = await service.getPortfolio(USER_ID, 1, 10, undefined, 'TSLA');
      expect(result.assets.length).toBe(0);
    });

    it('paginates assets correctly', async () => {
      const manyAssets = Array.from({ length: 15 }, (_, i) => ({
        ...mockAsset,
        _id: { toString: () => `asset-${i}` },
        toObject: () => ({ ...mockAsset, symbol: `SYM${i}` }),
      }));
      mockPortfolioModel.findOne.mockResolvedValue({ ...mockPortfolio, assets: manyAssets });

      const page1 = await service.getPortfolio(USER_ID, 1, 10);
      expect(page1.assets).toHaveLength(10);
      expect(page1.hasMore).toBe(true);

      const page2 = await service.getPortfolio(USER_ID, 2, 10);
      expect(page2.assets).toHaveLength(5);
      expect(page2.hasMore).toBe(false);
    });
  });

  // ── addAsset ───────────────────────────────────────────────
  describe('addAsset', () => {
    it('adds a new asset and records a BUY transaction', async () => {
      const dto = { name: 'Apple', symbol: 'AAPL', type: 'STOCK' as const, quantity: 10, purchasePrice: 150, currentPrice: 175 };
      mockPortfolioModel.findOneAndUpdate.mockResolvedValue(mockPortfolio);
      mockTransactionModel.create.mockResolvedValue({});
      mockSnapshotModel.create.mockResolvedValue({});

      await service.addAsset(USER_ID, dto);

      expect(mockPortfolioModel.findOneAndUpdate).toHaveBeenCalled();
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ transactionType: 'BUY', symbol: 'AAPL' }),
      );
    });
  });

  // ── updateAsset ────────────────────────────────────────────
  describe('updateAsset', () => {
    it('throws NotFoundException when asset does not exist', async () => {
      mockPortfolioModel.findOne.mockResolvedValue(null);
      await expect(service.updateAsset(USER_ID, ASSET_ID, {})).rejects.toThrow(NotFoundException);
    });

    it('records a BUY transaction when quantity increases', async () => {
      mockPortfolioModel.findOne.mockResolvedValue(mockPortfolio);
      mockPortfolioModel.findOneAndUpdate.mockResolvedValue(mockPortfolio);
      mockTransactionModel.create.mockResolvedValue({});
      mockSnapshotModel.create.mockResolvedValue({});

      await service.updateAsset(USER_ID, ASSET_ID, { quantity: 15 });

      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ transactionType: 'BUY', quantity: 5 }),
      );
    });

    it('records a SELL transaction when quantity decreases', async () => {
      mockPortfolioModel.findOne.mockResolvedValue(mockPortfolio);
      mockPortfolioModel.findOneAndUpdate.mockResolvedValue(mockPortfolio);
      mockTransactionModel.create.mockResolvedValue({});
      mockSnapshotModel.create.mockResolvedValue({});

      await service.updateAsset(USER_ID, ASSET_ID, { quantity: 5 });

      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ transactionType: 'SELL', quantity: 5 }),
      );
    });

    it('records an UPDATE transaction when only price changes', async () => {
      mockPortfolioModel.findOne.mockResolvedValue(mockPortfolio);
      mockPortfolioModel.findOneAndUpdate.mockResolvedValue(mockPortfolio);
      mockTransactionModel.create.mockResolvedValue({});
      mockSnapshotModel.create.mockResolvedValue({});

      await service.updateAsset(USER_ID, ASSET_ID, { currentPrice: 200 });

      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ transactionType: 'UPDATE' }),
      );
    });
  });

  // ── removeAsset ────────────────────────────────────────────
  describe('removeAsset', () => {
    it('removes an asset and records a SELL transaction', async () => {
      mockPortfolioModel.findOne.mockResolvedValue(mockPortfolio);
      mockPortfolioModel.findOneAndUpdate.mockResolvedValue({ ...mockPortfolio, assets: [] });
      mockTransactionModel.create.mockResolvedValue({});
      mockSnapshotModel.create.mockResolvedValue({});

      await service.removeAsset(USER_ID, ASSET_ID);

      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ transactionType: 'SELL', symbol: 'AAPL' }),
      );
    });
  });

  // ── getTransactions ────────────────────────────────────────
  describe('getTransactions', () => {
    it('returns paginated transactions sorted by date', async () => {
      const mockTxns = [{ symbol: 'AAPL', transactionType: 'BUY' }];
      mockTransactionModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTxns),
      });
      mockTransactionModel.countDocuments.mockResolvedValue(1);

      const result = await service.getTransactions(USER_ID);
      expect(result.transactions).toEqual(mockTxns);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });

  // ── getChartData ───────────────────────────────────────────
  describe('getChartData', () => {
    it('returns cached chart data when available', async () => {
      const cached = { labels: ['Jan 1'], values: [1000], costs: [900] };
      mockRedisService.get.mockResolvedValueOnce(cached);

      const result = await service.getChartData(USER_ID);
      expect(result).toEqual(cached);
      expect(mockSnapshotModel.find).not.toHaveBeenCalled();
    });

    it('computes and caches chart data from snapshots', async () => {
      mockRedisService.get.mockResolvedValueOnce(null);
      const snapshots = [{ totalValue: 1000, totalCost: 900, createdAt: new Date('2025-01-01') }];
      mockSnapshotModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(snapshots),
      });

      const result = await service.getChartData(USER_ID);
      expect(result.values[result.values.length - 1]).toEqual(1000);
      expect(result.values.length).toBe(30);
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });
});
