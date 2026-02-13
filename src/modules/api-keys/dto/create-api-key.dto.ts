import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    permissions?: string[]; // Defaults to ['*'] in service

    @IsDateString()
    @IsOptional()
    expiresAt?: string; // Optional expiry date

    @IsString()
    @IsOptional()
    organization?: string; // Optional organization id — only allowed for superadmins
}
