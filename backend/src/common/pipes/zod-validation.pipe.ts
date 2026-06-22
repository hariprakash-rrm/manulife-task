import { PipeTransform, BadRequestException, ArgumentMetadata } from '@nestjs/common';

interface ZodLike {
  safeParse(value: unknown): {
    success: boolean;
    data?: unknown;
    error?: { flatten(): { fieldErrors: Record<string, string[]>; formErrors: string[] } };
  };
}

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodLike) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') return value;
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error!.flatten().fieldErrors);
    }
    return result.data;
  }
}
