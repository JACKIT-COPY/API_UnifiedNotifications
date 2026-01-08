import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  // orgId is now REQUIRED — no fallback in production
  async getUsers(orgId: string): Promise<User[]> {
    return this.userModel.find({ organization: new Types.ObjectId(orgId) } as any).exec();
  }

  // Helper methods we'll use later
  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async createUser(userData: Partial<User>) {
    const user = new this.userModel(userData);
    return user.save();
  }
}