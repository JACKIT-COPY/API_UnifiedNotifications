// src/modules/payment-methods/controllers/payment-methods/payment-methods.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PaymentMethodsService } from '../../services/payment-methods/payment-methods.service';
import { CreatePaymentMethodDto } from '../../dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from '../../dto/update-payment-method.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from 'src/modules/auth/guards/super-admin.guard';

@Controller('payment-methods')
@UseGuards(JwtAuthGuard, SuperAdminGuard) // Only superadmins can access
export class PaymentMethodsController {
    constructor(private readonly paymentMethodsService: PaymentMethodsService) { }

    /**
     * Get all payment methods
     * GET /payment-methods
     */
    @Get()
    async findAll() {
        return this.paymentMethodsService.findAll();
    }

    /**
     * Get a single payment method by ID
     * GET /payment-methods/:id
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.paymentMethodsService.findOne(id);
    }

    /**
     * Get the default payment method
     * GET /payment-methods/default/active
     */
    @Get('default/active')
    async findDefault() {
        return this.paymentMethodsService.findDefault();
    }

    /**
     * Create a new payment method
     * POST /payment-methods
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createDto: CreatePaymentMethodDto) {
        return this.paymentMethodsService.create(createDto);
    }

    /**
     * Update a payment method
     * PUT /payment-methods/:id
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdatePaymentMethodDto,
    ) {
        return this.paymentMethodsService.update(id, updateDto);
    }

    /**
     * Set a payment method as default
     * PUT /payment-methods/:id/default
     */
    @Put(':id/default')
    async setDefault(@Param('id') id: string) {
        return this.paymentMethodsService.setDefault(id);
    }

    /**
     * Toggle active status
     * PUT /payment-methods/:id/toggle-active
     */
    @Put(':id/toggle-active')
    async toggleActive(@Param('id') id: string) {
        return this.paymentMethodsService.toggleActive(id);
    }

    /**
     * Delete a payment method
     * DELETE /payment-methods/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.paymentMethodsService.remove(id);
    }
}
