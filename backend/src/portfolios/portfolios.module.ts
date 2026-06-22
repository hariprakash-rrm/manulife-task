import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfoliosController } from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';
import { Portfolio, PortfolioSchema } from './schemas/portfolio.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { PortfolioSnapshot, SnapshotSchema } from './schemas/snapshot.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Portfolio.name, schema: PortfolioSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: PortfolioSnapshot.name, schema: SnapshotSchema },
    ]),
  ],
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
