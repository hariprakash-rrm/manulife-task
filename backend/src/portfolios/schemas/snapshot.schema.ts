import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SnapshotDocument = PortfolioSnapshot & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class PortfolioSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  totalValue: number;

  @Prop({ required: true })
  totalCost: number;

  @Prop({ required: true })
  returnPercentage: number;
}

export const SnapshotSchema = SchemaFactory.createForClass(PortfolioSnapshot);
SnapshotSchema.index({ userId: 1, createdAt: -1 });
