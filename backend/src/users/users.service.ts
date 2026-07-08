import { Injectable, InternalServerErrorException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(email: string, hashedPassword: string): Promise<UserDocument> {
    try {
      return await this.userModel.create({ email, password: hashedPassword });
    } catch (error: any) {
      if (error.code === 11000) throw new ConflictException('Email already exists');
      if (error.name === 'ValidationError') throw new BadRequestException(error.message);
      throw new InternalServerErrorException(`Failed to create user: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ email }).exec();
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to find user by email: ${error.message}`);
    }
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findById(id).exec();
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to find user by ID: ${error.message}`);
    }
  }

  async updateRefreshTokenHash(userId: string, hash: string | null): Promise<void> {
    try {
      await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: hash }).exec();
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to update refresh token: ${error.message}`);
    }
  }
}
