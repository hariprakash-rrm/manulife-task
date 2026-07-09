import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

const mockUsersService = {
  findById: jest.fn(),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object on successful payload validation', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      const user = { _id: '1', email: 'test@example.com' };
      mockUsersService.findById.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(mockUsersService.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual({ id: '1', email: 'test@example.com' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      mockUsersService.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
