// src/modules/transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from './controllers/transactions/transactions.controller';
import { TransactionsService } from './services/transactions/transactions.service';
import { Transaction, TransactionSchema } from 'src/schemas/transaction.schema';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
        PaymentMethodsModule,
        OrganizationsModule,
    ],
    controllers: [TransactionsController],
    providers: [TransactionsService],
    exports: [TransactionsService],
})
export class TransactionsModule { }
