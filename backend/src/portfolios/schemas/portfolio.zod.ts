import { z } from 'zod';

export const AddAssetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  type: z.enum(['STOCK', 'BOND', 'MUTUAL_FUND', 'CRYPTO', 'CASH']),
  quantity: z.number().positive("Quantity must be positive"),
  purchasePrice: z.number().nonnegative("Purchase price cannot be negative"),
  currentPrice: z.number().nonnegative("Current price cannot be negative"),
});

export const UpdateAssetSchema = AddAssetSchema.partial();

export type AddAssetDto = z.infer<typeof AddAssetSchema>;
export type UpdateAssetDto = z.infer<typeof UpdateAssetSchema>;
