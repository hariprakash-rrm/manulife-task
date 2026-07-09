import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with the provided dto', async () => {
      const dto: RegisterDto = { email: 'test@example.com', password: 'password123' };
      const expectedResult = { accessToken: 'token', user: { id: '1', email: dto.email } };
      
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException if authService.register throws', async () => {
      const dto: RegisterDto = { email: 'test@example.com', password: 'password123' };
      mockAuthService.register.mockRejectedValue(new Error('ConflictException'));
      await expect(controller.register(dto)).rejects.toThrow('ConflictException');
    });
  });

  describe('login', () => {
    it('should call authService.login with the provided dto', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const expectedResult = { accessToken: 'token', user: { id: '1', email: dto.email } };
      
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException if authService.login throws', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password123' };
      mockAuthService.login.mockRejectedValue(new Error('UnauthorizedException'));
      await expect(controller.login(dto)).rejects.toThrow('UnauthorizedException');
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with the user id and email', async () => {
      const user = { id: '1', email: 'test@example.com' };
      const expectedResult = { accessToken: 'new-token', refreshToken: 'new-refresh' };
      
      mockAuthService.refresh.mockResolvedValue(expectedResult);

      const result = await controller.refresh(user as any);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(user.id, user.email);
      expect(result).toEqual(expectedResult);
    });

    it('should throw error if authService.refresh throws', async () => {
      const user = { id: '1', email: 'test@example.com' };
      mockAuthService.refresh.mockRejectedValue(new Error('UnauthorizedException'));
      await expect(controller.refresh(user as any)).rejects.toThrow('UnauthorizedException');
    });
  });

  describe('logout', () => {
    it('should call authService.logout with the user id', async () => {
      const user = { id: '1', email: 'test@example.com' };
      
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(user as any);

      expect(mockAuthService.logout).toHaveBeenCalledWith(user.id);
    });
  });

  describe('me', () => {
    it('should return the current user', () => {
      const user = { id: '1', email: 'test@example.com' };
      const result = controller.me(user as any);
      expect(result).toEqual(user);
    });
  });
});
