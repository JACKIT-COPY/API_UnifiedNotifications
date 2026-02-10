// src/modules/payment-methods/dto/update-payment-method.dto.ts
import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePaymentMethodDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    shortcode?: string;

    @IsString()
    @IsOptional()
    passkey?: string;

    @IsString()
    @IsOptional()
    consumerKey?: string;

    @IsString()
    @IsOptional()
    consumerSecret?: string;

    @IsEnum(['paybill', 'till'])
    @IsOptional()
    mpesaType?: string;

    @IsString()
    @IsOptional()
    storeNumber?: string;

    @IsEnum(['sandbox', 'production'])
    @IsOptional()
    environment?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}
