import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplatesController } from './controllers/templates.controller';
import { TemplatesService } from './services/templates.service';
import { TemplateSchema } from '../../schemas/template.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Template', schema: TemplateSchema }]),
    ],
    controllers: [TemplatesController],
    providers: [TemplatesService],
    exports: [TemplatesService],
})
export class TemplatesModule { }
