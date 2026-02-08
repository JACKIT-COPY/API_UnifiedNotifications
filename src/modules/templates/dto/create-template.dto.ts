import { IsNotEmpty, IsString, IsEnum, IsOptional, IsArray } from 'class-validator';

export class CreateTemplateDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    category: string;

    @IsNotEmpty()
    @IsEnum(['email', 'sms', 'whatsapp'])
    channel: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    subject?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    variables?: string[];
}
