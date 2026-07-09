import { ZodValidationPipe } from './zod-validation.pipe';
import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().positive(),
  });

  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(schema);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return parsed data when validation passes', () => {
    const validData = { name: 'Alice', age: 30 };
    const result = pipe.transform(validData, { type: 'body' });
    expect(result).toEqual(validData);
  });

  it('should throw BadRequestException when validation fails', () => {
    const invalidData = { name: 'Alice', age: -5 }; // age should be positive
    expect(() => pipe.transform(invalidData, { type: 'body' })).toThrow(BadRequestException);
  });

  it('should throw BadRequestException when data has wrong types', () => {
    const invalidData = { name: 123, age: '30' }; 
    expect(() => pipe.transform(invalidData, { type: 'body' })).toThrow(BadRequestException);
  });
});
