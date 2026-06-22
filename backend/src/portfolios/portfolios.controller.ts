import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Request, Query,
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
  getPortfolio(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.portfoliosService.getPortfolio(
      req.user.id,
      parseInt(page ?? '1', 10),
      parseInt(limit ?? '10', 10),
      type,
      search,
    );
  }

  @Get('transactions')
  getTransactions(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.portfoliosService.getTransactions(
      req.user.id,
      parseInt(page ?? '1', 10),
      parseInt(limit ?? '20', 10),
    );
  }

  @Get('chart')
  getChartData(@Request() req: any, @Query('limit') limit?: string) {
    return this.portfoliosService.getChartData(req.user.id, parseInt(limit ?? '30', 10));
  }

  @Post('assets')
  addAsset(
    @Request() req: any,
    @Body(new ZodValidationPipe(AddAssetSchema)) dto: AddAssetDto,
  ) {
    return this.portfoliosService.addAsset(req.user.id, dto);
  }

  @Put('assets/:id')
  updateAsset(
    @Request() req: any,
    @Param('id') assetId: string,
    @Body(new ZodValidationPipe(UpdateAssetSchema)) dto: UpdateAssetDto,
  ) {
    return this.portfoliosService.updateAsset(req.user.id, assetId, dto);
  }

  @Delete('assets/:id')
  removeAsset(@Request() req: any, @Param('id') assetId: string) {
    return this.portfoliosService.removeAsset(req.user.id, assetId);
  }
}
