import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RegisterSchema } from './dto/register.dto';
import type { RegisterDto } from './dto/register.dto';
import { LoginSchema } from './dto/login.dto';
import type { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto) {
    try {
      return await this.authService.register(dto);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
    try {
      return await this.authService.login(dto);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(@CurrentUser() user: AuthUser) {
    try {
      return await this.authService.refresh(user.id, user.email);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: AuthUser) {
    try {
      return await this.authService.logout(user.id);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    try {
      return user;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'Internal server error');
    }
  }
}
