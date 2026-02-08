import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Template } from 'src/schemas/template.schema';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';

@Injectable()
export class TemplatesService {
    constructor(
        @InjectModel('Template') private templateModel: Model<Template>,
    ) { }

    async create(createTemplateDto: CreateTemplateDto, orgId: string, userId: string): Promise<Template> {
        const template = new this.templateModel({
            ...createTemplateDto,
            organization: new Types.ObjectId(orgId),
            createdBy: new Types.ObjectId(userId),
        });
        return template.save();
    }

    async findAll(orgId: string): Promise<Template[]> {
        return this.templateModel
            .find({ organization: new Types.ObjectId(orgId) })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findOne(id: string, orgId: string): Promise<Template> {
        const template = await this.templateModel.findOne({
            _id: new Types.ObjectId(id),
            organization: new Types.ObjectId(orgId),
        }).exec();

        if (!template) {
            throw new BadRequestException('Template not found');
        }
        return template;
    }

    async update(id: string, updateTemplateDto: UpdateTemplateDto, orgId: string): Promise<Template> {
        const template = await this.templateModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id), organization: new Types.ObjectId(orgId) },
            { $set: updateTemplateDto },
            { new: true },
        ).exec();

        if (!template) {
            throw new BadRequestException('Template not found');
        }
        return template;
    }

    async remove(id: string, orgId: string): Promise<void> {
        const result = await this.templateModel.deleteOne({
            _id: new Types.ObjectId(id),
            organization: new Types.ObjectId(orgId),
        }).exec();

        if (result.deletedCount === 0) {
            throw new BadRequestException('Template not found');
        }
    }

    async incrementUsage(id: string): Promise<void> {
        await this.templateModel.findByIdAndUpdate(id, { $inc: { usage: 1 } }).exec();
    }
}
