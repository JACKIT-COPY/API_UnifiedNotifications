// src/modules/users/services/users/users.service.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async getUsers(orgId: string): Promise<User[]> {
    this.logger.log(`Fetching users for organization: ${orgId}`);

    const users = await this.userModel
      .find({ organization: new Types.ObjectId(orgId), isActive: true })
      .select('-password') // Never return password
      .exec();

      this.logger.log(`Found ${users.length} users for organization: ${orgId}`);
    return users;

  }

  async getUserById(id: string, orgId: string): Promise<User> {
    const user = await this.userModel
      .findOne({ _id: new Types.ObjectId(id), organization: new Types.ObjectId(orgId) })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(userData: Partial<User>, orgId: string): Promise<User> {
    const existing = await this.userModel.findOne({ email: userData.email });
    if (existing) throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(userData.password || 'default123', 10);
    const user = new this.userModel({
      ...userData,
      password: hashedPassword,
      organization: new Types.ObjectId(orgId),
      role: userData.role || 'user', // Default to 'user' unless admin specifies
      isActive: true,
    });

    return user.save();
  }

  async updateUser(id: string, updateData: Partial<User>, orgId: string): Promise<User> {
    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    });

    if (!user) throw new NotFoundException('User not found');

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(user, updateData);
    return user.save();
  }

  async deactivateUser(id: string, orgId: string): Promise<User> {
    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    });

    if (!user) throw new NotFoundException('User not found');
    if (!user.isActive) throw new BadRequestException('User already deactivated');

    user.isActive = false;
    return user.save();
  }

  async reactivateUser(id: string, orgId: string): Promise<User> {
    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.isActive) throw new BadRequestException('User already active');

    user.isActive = true;
    return user.save();
  }

  async deleteUser(id: string, orgId: string): Promise<void> {
    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    });

    if (!user) throw new NotFoundException('User not found');

    await user.deleteOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }
}