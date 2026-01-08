import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from 'src/schemas/group.schema';

@Injectable()
export class GroupsService {
  constructor(@InjectModel('Group') private groupModel: Model<Group>) {}

  async createGroup(payload: { name: string; description: string; color: string }, orgId: string): Promise<Group> {
    const existing = await this.groupModel.findOne({ name: payload.name, organization: new Types.ObjectId(orgId) } as any);
    if (existing) throw new BadRequestException('Group name exists in your organization');

    const group = new this.groupModel({ ...payload, organization: new Types.ObjectId(orgId) });
    return group.save();
  }

  async getGroups(orgId: string): Promise<Group[]> {
    return this.groupModel.find({ organization: new Types.ObjectId(orgId) } as any).exec();
  }

  async deleteGroup(id: string, orgId: string): Promise<void> {
    const group = await this.groupModel.findOne({ _id: new Types.ObjectId(id), organization: new Types.ObjectId(orgId) } as any);
    if (!group) throw new BadRequestException('Group not found');
    await group.deleteOne();
  }
}