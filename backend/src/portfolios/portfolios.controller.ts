import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Request, Query,
  InternalServerErrorException, HttpException
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AddAssetSchema, UpdateAssetSchema } from './schemas/portfolio.zod';
import type { AddAssetDto, UpdateAssetDto } from './schemas/portfolio.zod';

@UseGuards(JwtAuthGuard)
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get()
  async getPortfolio(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    try {
      return await this.portfoliosService.getPortfolio(
        req.user.id,
        parseInt(page ?? '1', 10),
        parseInt(limit ?? '10', 10),
        type,
        search,
      );
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }

  @Get('transactions')
  async getTransactions(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      return await this.portfoliosService.getTransactions(
        req.user.id,
        parseInt(page ?? '1', 10),
        parseInt(limit ?? '20', 10),
      );
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }

  @Get('chart')
  async getChartData(@Request() req: any, @Query('limit') limit?: string) {
    try {
      return await this.portfoliosService.getChartData(req.user.id, parseInt(limit ?? '30', 10));
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }

  @Post('assets')
  async addAsset(
    @Request() req: any,
    @Body(new ZodValidationPipe(AddAssetSchema)) dto: AddAssetDto,
  ) {
    try {
      return await this.portfoliosService.addAsset(req.user.id, dto);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }

  @Put('assets/:id')
  async updateAsset(
    @Request() req: any,
    @Param('id') assetId: string,
    @Body(new ZodValidationPipe(UpdateAssetSchema)) dto: UpdateAssetDto,
  ) {
    try {
      return await this.portfoliosService.updateAsset(req.user.id, assetId, dto);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }

  @Delete('assets/:id')
  async removeAsset(@Request() req: any, @Param('id') assetId: string) {
    try {
      return await this.portfoliosService.removeAsset(req.user.id, assetId);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }
}
