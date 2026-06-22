import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export type TransactionType = 'BUY' | 'SELL' | 'UPDATE';

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  assetId: string;

  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['STOCK', 'BOND', 'MUTUAL_FUND', 'CRYPTO', 'CASH'] })
  assetType: string;

  @Prop({ required: true, enum: ['BUY', 'SELL', 'UPDATE'] })
  transactionType: TransactionType;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  totalValue: number;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ userId: 1, createdAt: -1 });
