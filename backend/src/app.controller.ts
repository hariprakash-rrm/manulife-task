import { Controller, Get, InternalServerErrorException, HttpException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    try {
      return this.appService.getHello();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }
}
