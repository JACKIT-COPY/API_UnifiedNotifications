// src/modules/payment-methods/services/payment-methods/payment-methods.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentMethod, PaymentMethodDocument } from 'src/schemas/payment-method.schema';
import { CreatePaymentMethodDto } from '../../dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from '../../dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
    constructor(
        @InjectModel(PaymentMethod.name)
        private paymentMethodModel: Model<PaymentMethodDocument>,
    ) { }

    /**
     * Get all payment methods
     */
    async findAll(): Promise<PaymentMethod[]> {
        return this.paymentMethodModel.find().sort({ createdAt: -1 }).exec();
    }

    /**
     * Get a single payment method by ID
     */
    async findOne(id: string): Promise<PaymentMethod> {
        const paymentMethod = await this.paymentMethodModel.findById(id).exec();
        if (!paymentMethod) {
            throw new NotFoundException(`Payment method with ID ${id} not found`);
        }
        return paymentMethod;
    }

    /**
     * Get the default payment method
     */
    async findDefault(): Promise<PaymentMethod | null> {
        return this.paymentMethodModel.findOne({ isDefault: true, isActive: true }).exec();
    }

    /**
     * Create a new payment method
     */
    async create(createDto: CreatePaymentMethodDto): Promise<PaymentMethod> {
        // If this is set as default, unset all other defaults
        if (createDto.isDefault) {
            await this.paymentMethodModel.updateMany(
                { isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        const newPaymentMethod = new this.paymentMethodModel({
            ...createDto,
            type: 'mpesa',
            provider: 'M-Pesa STK Push',
            transactionCount: 0,
            lastUsed: null,
        });

        return newPaymentMethod.save();
    }

    /**
     * Update a payment method
     */
    async update(id: string, updateDto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
        const paymentMethod = await this.findOne(id);

        // If setting this as default, unset all other defaults
        if (updateDto.isDefault === true) {
            await this.paymentMethodModel.updateMany(
                { _id: { $ne: id }, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        // If unsetting default, ensure at least one active method remains default
        if (updateDto.isDefault === false && paymentMethod.isDefault) {
            const otherActiveMethods = await this.paymentMethodModel.countDocuments({
                _id: { $ne: id },
                isActive: true,
            });

            if (otherActiveMethods === 0) {
                throw new BadRequestException('At least one payment method must be set as default');
            }

            // Set another active method as default
            await this.paymentMethodModel.findOneAndUpdate(
                { _id: { $ne: id }, isActive: true },
                { $set: { isDefault: true } }
            );
        }

        const updated = await this.paymentMethodModel.findByIdAndUpdate(
            id,
            { $set: updateDto },
            { new: true }
        );

        if (!updated) {
            throw new NotFoundException(`Payment method with ID ${id} not found`);
        }

        return updated;
    }

    /**
     * Set a payment method as default
     */
    async setDefault(id: string): Promise<PaymentMethod> {
        const paymentMethod = await this.findOne(id);

        if (!paymentMethod.isActive) {
            throw new BadRequestException('Cannot set an inactive payment method as default');
        }

        // Unset all other defaults
        await this.paymentMethodModel.updateMany(
            { _id: { $ne: id } },
            { $set: { isDefault: false } }
        );

        const updated = await this.paymentMethodModel.findByIdAndUpdate(
            id,
            { $set: { isDefault: true } },
            { new: true }
        );

        if (!updated) {
            throw new NotFoundException(`Payment method with ID ${id} not found`);
        }

        return updated;
    }

    /**
     * Toggle active status
     */
    async toggleActive(id: string): Promise<PaymentMethod> {
        const paymentMethod = await this.findOne(id);

        // If deactivating the default method, set another as default
        if (paymentMethod.isActive && paymentMethod.isDefault) {
            const otherActiveMethod = await this.paymentMethodModel.findOne({
                _id: { $ne: id },
                isActive: true,
            });

            if (!otherActiveMethod) {
                throw new BadRequestException(
                    'Cannot deactivate the only active payment method. Add another method first.'
                );
            }

            await this.paymentMethodModel.findByIdAndUpdate(
                otherActiveMethod._id,
                { $set: { isDefault: true } }
            );
        }

        const newActiveStatus = !paymentMethod.isActive;
        const updated = await this.paymentMethodModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    isActive: newActiveStatus,
                    isDefault: newActiveStatus ? paymentMethod.isDefault : false
                }
            },
            { new: true }
        );

        if (!updated) {
            throw new NotFoundException(`Payment method with ID ${id} not found`);
        }

        return updated;
    }

    /**
     * Delete a payment method
     */
    async remove(id: string): Promise<void> {
        const paymentMethod = await this.findOne(id);

        // Prevent deletion if it's the only active method
        if (paymentMethod.isActive) {
            const activeCount = await this.paymentMethodModel.countDocuments({ isActive: true });
            if (activeCount <= 1) {
                throw new BadRequestException(
                    'Cannot delete the only active payment method. Add another method first.'
                );
            }
        }

        // If deleting the default, set another as default
        if (paymentMethod.isDefault) {
            const otherActiveMethod = await this.paymentMethodModel.findOne({
                _id: { $ne: id },
                isActive: true,
            });

            if (otherActiveMethod) {
                otherActiveMethod.isDefault = true;
                await otherActiveMethod.save();
            }
        }

        await this.paymentMethodModel.findByIdAndDelete(id);
    }

    /**
     * Increment transaction count and update last used
     */
    async incrementUsage(id: string): Promise<void> {
        await this.paymentMethodModel.findByIdAndUpdate(id, {
            $inc: { transactionCount: 1 },
            $set: { lastUsed: new Date() },
        });
    }
}
