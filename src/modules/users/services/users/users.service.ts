// src/modules/users/services/users/users.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel('User') private userModel: Model<User>) { }

  async getUsers(orgId: string): Promise<User[]> {
    this.logger.log(`Fetching users for organization: ${orgId}`);

    const users = await this.userModel
      .find({ organization: new Types.ObjectId(orgId) }) // isActive no enforced
      .select('-password') // Never return password
      .exec();

    this.logger.log(`Found ${users.length} users for organization: ${orgId}`);
    return users;
  }

  async getAllUsersAcrossOrgs(): Promise<User[]> {
    this.logger.log('Fetching all users across all organizations');
    return this.userModel
      .find()
      .populate('organization')
      .select('-password')
      .exec();
  }

  async getUsersStatsAcrossOrgs() {
    const totalUsers = await this.userModel.countDocuments();
    const activeUsers = await this.userModel.countDocuments({ isActive: true });
    const inactiveUsers = await this.userModel.countDocuments({ isActive: false });

    // Users per organization
    const usersByOrg = await this.userModel.aggregate([
      {
        $group: {
          _id: '$organization',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'organizations',
          localField: '_id',
          foreignField: '_id',
          as: 'orgInfo',
        },
      },
      {
        $unwind: '$orgInfo',
      },
      {
        $project: {
          _id: 1,
          name: '$orgInfo.name',
          count: 1,
        },
      },
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByOrg,
    };
  }

  async getUserById(id: string, orgId?: string): Promise<User> {
    const query: any = { _id: new Types.ObjectId(id) };
    if (orgId) query.organization = new Types.ObjectId(orgId);

    const user = await this.userModel
      .findOne(query)
      .populate('organization')
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(userData: Partial<User>, orgId?: string): Promise<User> {
    const existing = await this.userModel.findOne({ email: userData.email });
    if (existing) throw new BadRequestException('Email already exists');

    const finalOrgId = userData.organization || orgId;
    if (!finalOrgId) throw new BadRequestException('Organization is required');

    const hashedPassword = await bcrypt.hash(
      userData.password || 'default123',
      10,
    );
    const user = new this.userModel({
      ...userData,
      password: hashedPassword,
      organization: new Types.ObjectId(finalOrgId as any),
      role: userData.role || 'user', // Default to 'user' unless admin specifies
      isActive: true,
    });

    return user.save();
  }

  async updateUser(
    id: string,
    updateData: Partial<User>,
    orgId?: string,
  ): Promise<User> {
    const query: any = { _id: new Types.ObjectId(id) };
    if (orgId) query.organization = new Types.ObjectId(orgId);

    const user = await this.userModel.findOne(query);

    if (!user) throw new NotFoundException('User not found');

    // Only hash and set password if explicitly provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      // Prevent overwriting existing password with undefined/null
      delete updateData.password;
    }

    Object.assign(user, updateData);
    return user.save();
  }

  async deactivateUser(id: string, orgId?: string): Promise<User> {
    const query: any = { _id: new Types.ObjectId(id) };
    if (orgId) query.organization = new Types.ObjectId(orgId);

    const user = await this.userModel.findOne(query);

    if (!user) throw new NotFoundException('User not found');
    if (!user.isActive)
      throw new BadRequestException('User already deactivated');

    user.isActive = false;
    return user.save();
  }

  async reactivateUser(id: string, orgId?: string): Promise<User> {
    const query: any = { _id: new Types.ObjectId(id) };
    if (orgId) query.organization = new Types.ObjectId(orgId);

    const user = await this.userModel.findOne(query);

    if (!user) throw new NotFoundException('User not found');
    if (user.isActive) throw new BadRequestException('User already active');

    user.isActive = true;
    return user.save();
  }

  async deleteUser(id: string, orgId?: string): Promise<void> {
    const query: any = { _id: new Types.ObjectId(id) };
    if (orgId) query.organization = new Types.ObjectId(orgId);

    const user = await this.userModel.findOne(query);

    if (!user) throw new NotFoundException('User not found');

    await user.deleteOne();
  }

  // src/modules/users/services/users/users.service.ts
  async changePassword(
    targetUserId: string,
    oldPassword: string,
    newPassword: string,
    requesterUserId: string,
    requesterOrgId?: string,
    isAdminReset: boolean = false, // Optional: if admin can reset without old password
  ): Promise<User> {
    const query: any = { _id: new Types.ObjectId(targetUserId) };
    if (requesterOrgId) query.organization = new Types.ObjectId(requesterOrgId);

    const targetUser = await this.userModel.findOne(query);

    if (!targetUser) throw new NotFoundException('User not found');

    // Security: Regular user can only change their own password
    if (requesterUserId !== targetUserId && !isAdminReset) {
      throw new ForbiddenException('You can only change your own password');
    }

    // Require old password unless admin reset
    if (!isAdminReset) {
      const isMatch = await bcrypt.compare(oldPassword, targetUser.password);
      if (!isMatch) throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password (optional: add length/strength check)
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    targetUser.password = await bcrypt.hash(newPassword, 10);
    return targetUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }
}
