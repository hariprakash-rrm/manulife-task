import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateRefreshTokenHash: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if user exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1' });

      await expect(service.register({ email: 'test@example.com', password: 'password123' }))
        .rejects
        .toThrow(ConflictException);
    });

    it('should create user and return tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      
      const createdUser = { _id: '1', email: 'test@example.com' };
      mockUsersService.create.mockResolvedValue(createdUser);
      
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.register({ email: 'test@example.com', password: 'password123' });

      expect(mockUsersService.create).toHaveBeenCalledWith('test@example.com', 'hashed-password');
      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user).toEqual({ id: '1', email: 'test@example.com' });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login({ email: 'test@example.com', password: 'password123' }))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if passwords do not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ _id: '1', email: 'test@example.com', password: 'hashed-password' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@example.com', password: 'wrongpassword' }))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should return tokens if login is successful', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ _id: '1', email: 'test@example.com', password: 'hashed-password' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user).toEqual({ id: '1', email: 'test@example.com' });
    });
  });

  describe('logout', () => {
    it('should clear the refresh token hash', async () => {
      await service.logout('1');
      expect(mockUsersService.updateRefreshTokenHash).toHaveBeenCalledWith('1', null);
    });
  });

  describe('refresh', () => {
    it('should return new tokens on successful refresh', async () => {
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-token');

      const result = await service.refresh('1', 'test@example.com');

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(mockUsersService.updateRefreshTokenHash).toHaveBeenCalledWith('1', 'new-hashed-token');
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockJwtService.signAsync.mockRejectedValue(new Error('Jwt error'));
      await expect(service.refresh('1', 'test@example.com')).rejects.toThrow('Refresh failed: Jwt error');
    });
  });
});
