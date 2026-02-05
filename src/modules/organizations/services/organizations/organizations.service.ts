// src/modules/organizations/services/organizations/organizations.service.ts (new service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization } from 'src/schemas/organization.schema';

@Injectable()
export class OrganizationsService {
  constructor(@InjectModel('Organization') private orgModel: Model<Organization>) { }

  async getById(id: string): Promise<Organization> {
    const org = await this.orgModel.findById(new Types.ObjectId(id)).exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findAll(): Promise<Organization[]> {
    return this.orgModel.find().exec();
  }

  async updateCredentials(id: string, newCredentials: Record<string, string>): Promise<Organization> {
    const org = await this.orgModel.findById(new Types.ObjectId(id));
    if (!org) throw new NotFoundException('Organization not found');

    org.credentials = { ...org.credentials, ...newCredentials };
    return org.save();
  }

  async update(id: string, updateData: any): Promise<Organization> {
    const org = await this.orgModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: updateData },
      { new: true }
    ).exec();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }
}