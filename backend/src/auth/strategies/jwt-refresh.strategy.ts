import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../../users/users.service';
import { JwtPayload, AuthUser } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET ?? 'jwt-refresh-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<AuthUser> {
    const refreshToken = req.headers.authorization?.split(' ')[1];
    if (!refreshToken) throw new UnauthorizedException();

    const user = await this.usersService.findById(payload.sub);
    if (!user?.refreshTokenHash) throw new UnauthorizedException();

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenMatches) throw new UnauthorizedException();

    return { id: (user._id as { toString(): string }).toString(), email: user.email };
  }
}
