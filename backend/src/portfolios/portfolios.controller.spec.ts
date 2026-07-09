import { Test, TestingModule } from '@nestjs/testing';
import { PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AddAssetDto, UpdateAssetDto } from './schemas/portfolio.zod';

const mockPortfoliosService = {
  getPortfolio: jest.fn(),
  addAsset: jest.fn(),
  updateAsset: jest.fn(),
  removeAsset: jest.fn(),
  getTransactions: jest.fn(),
  getChartData: jest.fn(),
};

describe('PortfoliosController', () => {
  let controller: PortfoliosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfoliosController],
      providers: [
        { provide: PortfoliosService, useValue: mockPortfoliosService },
      ],
    }).compile();

    controller = module.get<PortfoliosController>(PortfoliosController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPortfolio', () => {
    it('should return portfolio', async () => {
      const req = { user: { id: '1' } };
      mockPortfoliosService.getPortfolio.mockResolvedValue('portfolio-data');
      const result = await controller.getPortfolio(req, '1', '10');
      expect(result).toEqual('portfolio-data');
      expect(mockPortfoliosService.getPortfolio).toHaveBeenCalledWith('1', 1, 10, undefined, undefined);
    });

    it('should throw InternalServerErrorException on error', async () => {
      const req = { user: { id: '1' } };
      mockPortfoliosService.getPortfolio.mockRejectedValue(new Error('error'));
      await expect(controller.getPortfolio(req)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('addAsset', () => {
    it('should add an asset', async () => {
      const req = { user: { id: '1' } };
      const dto = { symbol: 'AAPL' } as AddAssetDto;
      mockPortfoliosService.addAsset.mockResolvedValue('added');
      const result = await controller.addAsset(req, dto);
      expect(result).toEqual('added');
    });

    it('should throw InternalServerErrorException on error', async () => {
      const req = { user: { id: '1' } };
      const dto = { symbol: 'AAPL' } as AddAssetDto;
      mockPortfoliosService.addAsset.mockRejectedValue(new Error('error'));
      await expect(controller.addAsset(req, dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateAsset', () => {
    it('should update an asset', async () => {
      const req = { user: { id: '1' } };
      const dto = { currentPrice: 100 } as UpdateAssetDto;
      mockPortfoliosService.updateAsset.mockResolvedValue('updated');
      const result = await controller.updateAsset(req, 'asset-1', dto);
      expect(result).toEqual('updated');
    });

    it('should propagate HttpException', async () => {
      const req = { user: { id: '1' } };
      const dto = { currentPrice: 100 } as UpdateAssetDto;
      mockPortfoliosService.updateAsset.mockRejectedValue(new NotFoundException('Not found'));
      await expect(controller.updateAsset(req, 'asset-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on error', async () => {
      const req = { user: { id: '1' } };
      const dto = { currentPrice: 100 } as UpdateAssetDto;
      mockPortfoliosService.updateAsset.mockRejectedValue(new Error('error'));
      await expect(controller.updateAsset(req, 'asset-1', dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('removeAsset', () => {
    it('should remove an asset', async () => {
      const req = { user: { id: '1' } };
      mockPortfoliosService.removeAsset.mockResolvedValue('removed');
      const result = await controller.removeAsset(req, 'asset-1');
      expect(result).toEqual('removed');
    });

    it('should propagate HttpException', async () => {
      const req = { user: { id: '1' } };
      mockPortfoliosService.removeAsset.mockRejectedValue(new NotFoundException('Not found'));
      await expect(controller.removeAsset(req, 'asset-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on error', async () => {
      const req = { user: { id: '1' } };
      mockPortfoliosService.removeAsset.mockRejectedValue(new Error('error'));
      await expect(controller.removeAsset(req, 'asset-1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getTransactions', () => {
    it('should return transactions', async () => {
      const req = { user: { id: '1' } };
      mockPortfoliosService.getTransactions.mockResolvedValue('transactions');
      const result = await controller.getTransactions(req, '1', '10');
      expect(result).toEqual('transactions');
    });

    it('should throw InternalServerErrorException on error', async () => {
      const req = { user: { id: '1' } };
      mockPortfoliosService.getTransactions.mockRejectedValue(new Error('error'));
      await expect(controller.getTransactions(req)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getChartData', () => {
    it('should return chart data', async () => {
      const req = { user: { id: '1' } };
      mockPortfoliosService.getChartData.mockResolvedValue('chart');
      const result = await controller.getChartData(req);
      expect(result).toEqual('chart');
    });

    it('should throw InternalServerErrorException on error', async () => {
      const req = { user: { id: '1' } };
      mockPortfoliosService.getChartData.mockRejectedValue(new Error('error'));
      await expect(controller.getChartData(req)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
