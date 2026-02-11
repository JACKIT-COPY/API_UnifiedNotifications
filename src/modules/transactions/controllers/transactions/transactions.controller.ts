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
    ForbiddenException,
} from '@nestjs/common';
import { TransactionsService } from '../../services/transactions/transactions.service';
import { InitiatePaymentDto } from '../../dto/initiate-payment.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard'; // Use AdminGuard for viewing specific org
import { SuperAdminGuard } from 'src/modules/auth/guards/super-admin.guard'; // Use SuperAdminGuard for all transactions

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    /**
     * Get all transactions (Super Admin only)
     * GET /transactions
     */
    @Get()
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    async findAll() {
        return this.transactionsService.findAll();
    }

    /**
     * Get transactions for the logged-in user's organization
     * GET /transactions/me
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async findMyTransactions(@Req() req: any) {
        const user = req.user;
        if (!user || !user.orgId) {
            throw new ForbiddenException('Organization not found for user');
        }
        return this.transactionsService.findByOrganization(user.orgId);
    }

    /**
     * Get transactions for a specific organization (Admin or Super Admin)
     * GET /transactions/organization/:orgId
     */
    @Get('organization/:orgId')
    @UseGuards(JwtAuthGuard)
    async findByOrganization(@Param('orgId') orgId: string, @Req() req: any) {
        const user = req.user;

        // Super-admin can view any organization's transactions
        // Admin/User can only view their own organization's transactions
        if (user.role !== 'superadmin' && user.orgId !== orgId) {
            throw new ForbiddenException('You do not have access to these transactions');
        }

        return this.transactionsService.findByOrganization(orgId);
    }

    /**
     * Get a single transaction by ID
     * GET /transactions/:id
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string, @Req() req: any) {
        const transaction = await this.transactionsService.findOne(id);
        const user = req.user;

        // Check ownership
        if (user.role !== 'superadmin' && user.orgId !== (transaction as any).organizationId?._id?.toString() && user.orgId !== (transaction as any).organizationId?.toString()) {
            throw new ForbiddenException('You do not have access to this transaction');
        }

        return transaction;
    }

    /**
     * Initiate a payment (Any authenticated user)
     * POST /transactions/purchase
     */
    @Post('purchase')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async initiatePayment(@Req() req: any, @Body() initiateDto: InitiatePaymentDto) {
        return this.transactionsService.initiatePayment(req.user, initiateDto);
    }

    /**
     * M-Pesa Callback (Public)
     * POST /transactions/callback
     */
    @Post('callback')
    @HttpCode(HttpStatus.OK)
    async callback(@Body() payload: any) {
        console.log('M-Pesa Callback Received:', JSON.stringify(payload));
        return this.transactionsService.handleCallback(payload);
    }
}
