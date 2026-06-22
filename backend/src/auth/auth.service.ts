import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(dto.email, hashedPassword);
    const id = (user._id as { toString(): string }).toString();

    const tokens = await this.generateTokens(id, user.email);
    await this.storeRefreshHash(id, tokens.refreshToken);
    return { ...tokens, user: { id, email: user.email } };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const id = (user._id as { toString(): string }).toString();
    const tokens = await this.generateTokens(id, user.email);
    await this.storeRefreshHash(id, tokens.refreshToken);
    return { ...tokens, user: { id, email: user.email } };
  }

  async refresh(userId: string, email: string) {
    const tokens = await this.generateTokens(userId, email);
    await this.storeRefreshHash(userId, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sign = (secret: string, expiresIn: string) =>
      this.jwtService.signAsync(payload, { secret, expiresIn: expiresIn as any });

    const [accessToken, refreshToken] = await Promise.all([
      sign(process.env.JWT_SECRET ?? 'jwt-secret', process.env.JWT_EXPIRES_IN ?? '15m'),
      sign(process.env.JWT_REFRESH_SECRET ?? 'jwt-refresh-secret', process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'),
    ]);
    return { accessToken, refreshToken };
  }

  private async storeRefreshHash(userId: string, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshTokenHash(userId, hash);
  }
}
