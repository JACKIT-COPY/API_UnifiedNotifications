import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentSession, PaymentSessionSchema } from './schemas/payment-session.schema';
import { PaymentSessionsService } from './services/payment-sessions.service';
import { PaymentSessionsController } from './controllers/payment-sessions.controller';
import { PublicPaymentsController } from './controllers/public-payments.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PaymentSession.name, schema: PaymentSessionSchema }]),
    OrganizationsModule,
    forwardRef(() => TransactionsModule),
  ],
  controllers: [PaymentSessionsController, PublicPaymentsController],
  providers: [PaymentSessionsService],
  exports: [PaymentSessionsService],
})
export class PaymentSessionsModule {}
