// src/modules/payment-methods/payment-methods.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentMethodsController } from './controllers/payment-methods/payment-methods.controller';
import { PaymentMethodsService } from './services/payment-methods/payment-methods.service';
import { PaymentMethod, PaymentMethodSchema } from 'src/schemas/payment-method.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PaymentMethod.name, schema: PaymentMethodSchema },
        ]),
    ],
    controllers: [PaymentMethodsController],
    providers: [PaymentMethodsService],
    exports: [PaymentMethodsService], // Export for use in payment processing
})
export class PaymentMethodsModule { }
