import { Injectable, NotFoundException, InternalServerErrorException, HttpException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Portfolio, PortfolioDocument } from './schemas/portfolio.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { PortfolioSnapshot, SnapshotDocument } from './schemas/snapshot.schema';
import type { AddAssetDto, UpdateAssetDto } from './schemas/portfolio.zod';
import { RedisService } from '../common/redis/redis.service';

const CACHE_TTL = 60;
const summaryKey = (uid: string) => `portfolio:summary:${uid}`;

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(PortfolioSnapshot.name) private snapshotModel: Model<SnapshotDocument>,
    private redis: RedisService,
  ) {}

  // ── Read ──────────────────────────────────────────────────────
  async getPortfolio(
    userId: string,
    page = 1,
    limit = 10,
    type?: string,
    search?: string,
  ) {
    try {
      let portfolio = await this.portfolioModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!portfolio) {
        portfolio = await this.portfolioModel.create({ userId: new Types.ObjectId(userId), assets: [] });
      }

      let totalValue = 0;
      let totalCost = 0;

      const allWithMetrics = portfolio.assets.map((asset) => {
        const val = asset.quantity * asset.currentPrice;
        const cost = asset.quantity * asset.purchasePrice;
        totalValue += val;
        totalCost += cost;
        return {
          ...(asset as any).toObject(),
          totalValue: val,
          totalCost: cost,
          performancePercentage: cost > 0 ? ((val - cost) / cost) * 100 : 0,
        };
      });

      const totalReturnPercentage = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

      let filtered = [...allWithMetrics].reverse();
      if (type && type !== 'ALL') filtered = filtered.filter((a) => a.type === type);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q));
      }

      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        _id: portfolio._id,
        userId: portfolio.userId,
        assets: paginated,
        hasMore: start + limit < filtered.length,
        summary: { totalValue, totalCost, totalReturnPercentage },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to retrieve portfolio: ${error.message}`);
    }
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    try {
      const [transactions, total] = await Promise.all([
        this.transactionModel
          .find({ userId: new Types.ObjectId(userId) })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean()
          .exec(),
        this.transactionModel.countDocuments({ userId: new Types.ObjectId(userId) }),
      ]);
      return { transactions, total, page, limit, hasMore: page * limit < total };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to retrieve transactions: ${error.message}`);
    }
  }

  async getChartData(userId: string, limit = 30) {
    try {
      const cached = await this.redis.get<{ labels: string[]; values: number[]; costs: number[] }>(
        `portfolio:chart:${userId}`,
      );
      if (cached) return cached;

      let snapshots = await this.snapshotModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      // If no snapshots exist but portfolio has assets, create initial snapshot
      if (snapshots.length === 0) {
        const portfolio = await this.portfolioModel
          .findOne({ userId: new Types.ObjectId(userId) })
          .lean()
          .exec();
        if (portfolio && portfolio.assets && portfolio.assets.length > 0) {
          let totalValue = 0;
          let totalCost = 0;
          for (const a of portfolio.assets) {
            totalValue += a.quantity * a.currentPrice;
            totalCost += a.quantity * a.purchasePrice;
          }
          await this.snapshotModel.create({
            userId: new Types.ObjectId(userId),
            totalValue,
            totalCost,
            returnPercentage: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
          });
          snapshots = await this.snapshotModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()
            .exec();
        }
      }

      const ordered = snapshots.reverse();
      let labels: string[] = [];
      let values: number[] = [];
      let costs: number[] = [];

      if (ordered.length > 0) {
        const finalSnapshots = [...ordered];
        // Backfill to 30 days if we have some snapshots but less than 30
        if (ordered.length < limit) {
          const oldest = ordered[0];
          const oldestDate = new Date((oldest as any).createdAt || new Date());
          const backfillCount = limit - ordered.length;
          const backfilled: any[] = [];
          
          for (let i = backfillCount; i > 0; i--) {
            const date = new Date(oldestDate.getTime() - i * 24 * 60 * 60 * 1000);
            // Simulate slight market oscillation (sinewave + random walk)
            const changePct = (Math.sin(i * 0.5) * 0.02) + ((Math.random() - 0.5) * 0.015);
            const simulatedValue = oldest.totalValue * (1 + changePct);
            backfilled.push({
              createdAt: date,
              totalValue: Math.round(simulatedValue * 100) / 100,
              totalCost: oldest.totalCost,
            });
          }
          finalSnapshots.unshift(...backfilled);
        }

        labels = finalSnapshots.map((s) =>
          new Date((s as any).createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        );
        values = finalSnapshots.map((s) => s.totalValue);
        costs = finalSnapshots.map((s) => s.totalCost);
      }

      const result = { labels, values, costs };
      await this.redis.set(`portfolio:chart:${userId}`, result, CACHE_TTL * 5);
      return result;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to get chart data: ${error.message}`);
    }
  }

  // ── Write ─────────────────────────────────────────────────────
  async addAsset(userId: string, dto: AddAssetDto) {
    try {
      const portfolio = await this.portfolioModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $push: { assets: dto } },
        { new: true, upsert: true },
      );

      const newAsset = portfolio!.assets[portfolio!.assets.length - 1];
      await this.recordTransaction(userId, {
        assetId: (newAsset._id as any).toString(),
        symbol: dto.symbol,
        name: dto.name,
        assetType: dto.type,
        transactionType: 'BUY',
        quantity: dto.quantity,
        price: dto.purchasePrice,
      });
      await this.invalidateCache(userId, portfolio!);
      return portfolio;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error.name === 'ValidationError') throw new BadRequestException(error.message);
      throw new InternalServerErrorException(`Failed to add asset: ${error.message}`);
    }
  }

  async updateAsset(userId: string, assetId: string, dto: UpdateAssetDto) {
    try {
      const existing = await this.portfolioModel.findOne({
        userId: new Types.ObjectId(userId),
        'assets._id': new Types.ObjectId(assetId),
      });
      if (!existing) throw new NotFoundException('Asset not found');

      const asset = existing.assets.find((a) => (a._id as any).toString() === assetId)!;

      const updateQuery: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(dto)) {
        if (value !== undefined) updateQuery[`assets.$.${key}`] = value;
      }

      const portfolio = await this.portfolioModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), 'assets._id': new Types.ObjectId(assetId) },
        { $set: updateQuery },
        { new: true },
      );

      const newQty = dto.quantity ?? asset.quantity;
      const qtyDelta = newQty - asset.quantity;
      if (qtyDelta !== 0) {
        await this.recordTransaction(userId, {
          assetId,
          symbol: asset.symbol,
          name: asset.name,
          assetType: asset.type,
          transactionType: qtyDelta > 0 ? 'BUY' : 'SELL',
          quantity: Math.abs(qtyDelta),
          price: dto.currentPrice ?? asset.currentPrice,
        });
      } else {
        await this.recordTransaction(userId, {
          assetId,
          symbol: asset.symbol,
          name: asset.name,
          assetType: asset.type,
          transactionType: 'UPDATE',
          quantity: asset.quantity,
          price: dto.currentPrice ?? asset.currentPrice,
        });
      }

      await this.invalidateCache(userId, portfolio!);
      return portfolio;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error.name === 'ValidationError') throw new BadRequestException(error.message);
      throw new InternalServerErrorException(`Failed to update asset: ${error.message}`);
    }
  }

  async removeAsset(userId: string, assetId: string) {
    try {
      const existing = await this.portfolioModel.findOne({
        userId: new Types.ObjectId(userId),
        'assets._id': new Types.ObjectId(assetId),
      });
      const asset = existing?.assets.find((a) => (a._id as any).toString() === assetId);

      const portfolio = await this.portfolioModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $pull: { assets: { _id: new Types.ObjectId(assetId) } } },
        { new: true },
      );

      if (asset) {
        await this.recordTransaction(userId, {
          assetId,
          symbol: asset.symbol,
          name: asset.name,
          assetType: asset.type,
          transactionType: 'SELL',
          quantity: asset.quantity,
          price: asset.currentPrice,
        });
      }
      await this.invalidateCache(userId, portfolio!);
      return portfolio;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Failed to remove asset: ${error.message}`);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  private async recordTransaction(
    userId: string,
    data: {
      assetId: string;
      symbol: string;
      name: string;
      assetType: string;
      transactionType: 'BUY' | 'SELL' | 'UPDATE';
      quantity: number;
      price: number;
    },
  ) {
    await this.transactionModel.create({
      userId: new Types.ObjectId(userId),
      ...data,
      totalValue: data.quantity * data.price,
    });
  }

  private async invalidateCache(userId: string, portfolio: PortfolioDocument) {
    await Promise.all([
      this.redis.delByPattern(`portfolio:summary:${userId}`),
      this.redis.del(`portfolio:chart:${userId}`),
    ]);

    // Record a portfolio value snapshot for the chart
    let totalValue = 0;
    let totalCost = 0;
    for (const a of portfolio.assets) {
      totalValue += a.quantity * a.currentPrice;
      totalCost += a.quantity * a.purchasePrice;
    }
    await this.snapshotModel.create({
      userId: new Types.ObjectId(userId),
      totalValue,
      totalCost,
      returnPercentage: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    });
    await this.redis.set(summaryKey(userId), { totalValue, totalCost }, CACHE_TTL);
  }
}
