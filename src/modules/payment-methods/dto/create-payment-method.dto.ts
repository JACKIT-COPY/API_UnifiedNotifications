// src/modules/payment-methods/dto/create-payment-method.dto.ts
import { IsString, IsEnum, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePaymentMethodDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    shortcode: string;

    @IsString()
    @IsNotEmpty()
    passkey: string;

    @IsString()
    @IsNotEmpty()
    consumerKey: string;

    @IsString()
    @IsNotEmpty()
    consumerSecret: string;

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
