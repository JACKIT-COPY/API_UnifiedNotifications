import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { TemplatesService } from '../services/templates.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
    constructor(private templatesService: TemplatesService) { }

    @Post()
    async create(@Body() createTemplateDto: CreateTemplateDto, @Request() req) {
        return this.templatesService.create(createTemplateDto, req.user.orgId, req.user.userId);
    }

    @Get()
    async findAll(@Request() req) {
        return this.templatesService.findAll(req.user.orgId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
        return this.templatesService.findOne(id, req.user.orgId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto, @Request() req) {
        return this.templatesService.update(id, updateTemplateDto, req.user.orgId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req) {
        return this.templatesService.remove(id, req.user.orgId);
    }
}
