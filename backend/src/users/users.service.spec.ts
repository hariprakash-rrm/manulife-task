import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';

const mockUserModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new user', async () => {
      const email = 'test@example.com';
      const password = 'hashedPassword123';
      const createdUser = { _id: '1', email, password };
      
      mockUserModel.create.mockResolvedValue(createdUser as any);

      const result = await service.create(email, password);

      expect(mockUserModel.create).toHaveBeenCalledWith({ email, password });
      expect(result).toEqual(createdUser);
    });

    it('should handle errors when creating a user', async () => {
      const email = 'test@example.com';
      const password = 'hashedPassword123';
      mockUserModel.create.mockRejectedValue(new Error('Duplicate email'));
      await expect(service.create(email, password)).rejects.toThrow('Duplicate email');
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email exists', async () => {
      const email = 'test@example.com';
      const user = { _id: '1', email };
      
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      } as any);

      const result = await service.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(user);
    });

    it('should return null if user does not exist', async () => {
      const email = 'notfound@example.com';
      
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });

    it('should handle errors if findByEmail throws', async () => {
      const email = 'test@example.com';
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      await expect(service.findByEmail(email)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return a user if id exists', async () => {
      const id = '1';
      const user = { _id: id, email: 'test@example.com' };
      
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      } as any);

      const result = await service.findById(id);

      expect(mockUserModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(user);
    });

    it('should handle errors if findById throws', async () => {
      const id = 'invalid-id';
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Invalid ID')),
      } as any);
      
      await expect(service.findById(id)).rejects.toThrow('Invalid ID');
    });
  });

  describe('updateRefreshTokenHash', () => {
    it('should update the refresh token hash', async () => {
      const id = '1';
      const hash = 'newHash123';
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      } as any);

      await service.updateRefreshTokenHash(id, hash);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(id, { refreshTokenHash: hash });
    });

    it('should handle errors if updateRefreshTokenHash throws', async () => {
      const id = '1';
      const hash = 'newHash123';
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      await expect(service.updateRefreshTokenHash(id, hash)).rejects.toThrow('Database error');
    });
  });
});
