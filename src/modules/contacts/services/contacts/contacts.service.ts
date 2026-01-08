import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contact } from 'src/schemas/contact.schema';

@Injectable()
export class ContactsService {
  constructor(@InjectModel('Contact') private contactModel: Model<Contact>) {}

  async createContact(payload: any, orgId: string): Promise<Contact> {
    // `organization` in the schema is the contact's company (string).
    // `notifyHubOrganization` is the owning org (ObjectId) required by schema.
    const contact = new this.contactModel({
      ...payload,
      notifyHubOrganization: new Types.ObjectId(orgId),
    });
    return contact.save();
  }

  async getContacts(orgId: string): Promise<Contact[]> {
    return this.contactModel
      .find({ notifyHubOrganization: new Types.ObjectId(orgId) } as any)
      .populate('groups')
      .exec();
  }

  async updateContact(id: string, payload: any, orgId: string): Promise<Contact> {
    const contact = await this.contactModel.findOne({
      _id: new Types.ObjectId(id),
      notifyHubOrganization: new Types.ObjectId(orgId),
    } as any);
    if (!contact) throw new BadRequestException('Contact not found');

    Object.assign(contact, payload);
    return contact.save();
  }

  async deleteContact(id: string, orgId: string): Promise<void> {
    const contact = await this.contactModel.findOne({
      _id: new Types.ObjectId(id),
      notifyHubOrganization: new Types.ObjectId(orgId),
    } as any);
    if (!contact) throw new BadRequestException('Contact not found');
    await contact.deleteOne();
  }
}