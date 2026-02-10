// src/modules/transactions/controllers/transactions/transactions.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import { TransactionsService } from '../../services/transactions/transactions.service';
import { InitiatePaymentDto } from '../../dto/initiate-payment.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard'; // Use AdminGuard for viewing specific org
import { SuperAdminGuard } from 'src/modules/auth/guards/super-admin.guard'; // Use SuperAdminGuard for all transactions

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    /**
     * Get all transactions (Super Admin only)
     * GET /transactions
     */
    @Get()
    @UseGuards(SuperAdminGuard)
    async findAll() {
        return this.transactionsService.findAll();
    }

    /**
     * Get transactions for a specific organization (Admin or Super Admin)
     * GET /transactions/organization/:orgId
     */
    @Get('organization/:orgId')
    @UseGuards(AdminGuard)
    async findByOrganization(@Param('orgId') orgId: string) {
        return this.transactionsService.findByOrganization(orgId);
    }

    /**
     * Get a single transaction by ID
     * GET /transactions/:id
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        // Ideally check if user belongs to org of transaction, or is super admin
        return this.transactionsService.findOne(id);
    }

    /**
     * Initiate a payment (Any authenticated user)
     * POST /transactions/purchase
     */
    @Post('purchase')
    @HttpCode(HttpStatus.CREATED)
    async initiatePayment(@Req() req: any, @Body() initiateDto: InitiatePaymentDto) {
        return this.transactionsService.initiatePayment(req.user, initiateDto);
    }
}
