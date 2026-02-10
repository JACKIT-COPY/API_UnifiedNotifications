// src/modules/transactions/dto/initiate-payment.dto.ts
import { IsNumber, IsString, IsNotEmpty, Min, IsOptional } from 'class-validator';

export class InitiatePaymentDto {
    @IsNumber()
    @Min(1)
    amount: number;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string; // Phone number to receive STK push

    @IsString()
    @IsOptional()
    paymentMethodId?: string; // Optional: specify payment method, otherwise use default

    @IsString()
    @IsOptional()
    organizationId?: string; // If superadmin is making the payment for an org
}
