import {
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyDocument } from 'src/schemas/api-key.schema';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

export interface ApiKeyValidationResult {
    orgId: string;
    userId: string;
    permissions: string[];
    keyId: string;
}

@Injectable()
export class ApiKeysService {
    private readonly logger = new Logger(ApiKeysService.name);

    constructor(
        @InjectModel('ApiKey') private apiKeyModel: Model<ApiKey>,
    ) { }

    /**
     * Generate a new API key for an organization.
     * Returns the plaintext key ONCE — it is never stored or retrievable again.
     */
    async generateKey(
        orgId: string,
        userId: string,
        dto: CreateApiKeyDto,
    ): Promise<{ key: string; prefix: string; name: string; id: string }> {
        // Generate a cryptographically secure random key
        const rawKey = crypto.randomBytes(32).toString('hex'); // 64 hex chars
        const prefixedKey = `nk_${rawKey}`; // "nk_" = NotifyHub Key
        const prefix = prefixedKey.substring(0, 10); // "nk_" + first 7 hex chars

        // Hash the key for storage (like a password)
        const keyHash = await bcrypt.hash(prefixedKey, 10);

        const apiKey = new this.apiKeyModel({
            keyHash,
            prefix,
            name: dto.name,
            organization: orgId,
            createdBy: userId,
            permissions: dto.permissions || ['*'],
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        });

        await apiKey.save();

        this.logger.log(
            `[API-KEY] Generated key "${dto.name}" (prefix: ${prefix}) for org ${orgId}`,
        );

        return {
            key: prefixedKey, // ← Only returned once!
            prefix,
            name: dto.name,
            id: apiKey._id.toString(),
        };
    }

    /**
     * Validate an API key.
     * Looks up candidates by prefix, then bcrypt-compares to find a match.
     */
    async validateKey(plainKey: string): Promise<ApiKeyValidationResult | null> {
        if (!plainKey || !plainKey.startsWith('nk_')) {
            return null;
        }

        const prefix = plainKey.substring(0, 10);

        // Find active, non-expired keys matching this prefix
        const candidates = await this.apiKeyModel.find({
            prefix,
            isActive: true,
        });

        for (const candidate of candidates) {
            // Check expiry
            if (candidate.expiresAt && candidate.expiresAt < new Date()) {
                continue; // Skip expired keys
            }

            // bcrypt compare
            const isMatch = await bcrypt.compare(plainKey, candidate.keyHash);
            if (isMatch) {
                // Update lastUsedAt (fire and forget)
                this.apiKeyModel
                    .updateOne({ _id: candidate._id }, { lastUsedAt: new Date() })
                    .exec()
                    .catch((err) =>
                        this.logger.warn(`Failed to update lastUsedAt: ${err.message}`),
                    );

                return {
                    orgId: candidate.organization.toString(),
                    userId: candidate.createdBy.toString(),
                    permissions: candidate.permissions,
                    keyId: candidate._id.toString(),
                };
            }
        }

        return null;
    }

    /**
     * List all API keys for an organization (safe — no key hashes returned).
     */
    async listKeys(orgId?: string): Promise<any[]> {
        const filter: any = {};
        if (orgId) filter.organization = orgId;

        const keys = await this.apiKeyModel
            .find(filter)
            .select('prefix name permissions isActive lastUsedAt expiresAt createdAt createdBy organization')
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .exec();

        return keys;
    }

    /**
     * Revoke (deactivate) an API key.
     */
    async revokeKey(keyId: string, orgId?: string): Promise<any> {
        const query: any = { _id: keyId };
        if (orgId) query.organization = orgId;

        const key = await this.apiKeyModel.findOne(query);

        if (!key) {
            throw new NotFoundException('API key not found');
        }

        key.isActive = false;
        await key.save();

        this.logger.log(`[API-KEY] Revoked key "${key.name}" (prefix: ${key.prefix})` + (orgId ? ` for org ${orgId}` : ''));

        return { message: 'API key revoked successfully', prefix: key.prefix };
    }

    /**
     * Re-activate a previously revoked API key.
     */
    async activateKey(keyId: string, orgId?: string): Promise<any> {
        const query: any = { _id: keyId };
        if (orgId) query.organization = orgId;

        const key = await this.apiKeyModel.findOne(query);

        if (!key) {
            throw new NotFoundException('API key not found');
        }

        key.isActive = true;
        await key.save();

        this.logger.log(`[API-KEY] Re-activated key "${key.name}" (prefix: ${key.prefix})` + (orgId ? ` for org ${orgId}` : ''));

        return { message: 'API key activated successfully', prefix: key.prefix };
    }

    /**
     * Permanently delete an API key.
     */
    async deleteKey(keyId: string, orgId?: string): Promise<any> {
        const query: any = { _id: keyId };
        if (orgId) query.organization = orgId;

        const key = await this.apiKeyModel.findOneAndDelete(query);

        if (!key) {
            throw new NotFoundException('API key not found');
        }

        this.logger.log(`[API-KEY] Deleted key "${key.name}" (prefix: ${key.prefix})` + (orgId ? ` for org ${orgId}` : ''));

        return { message: 'API key deleted permanently' };
    }
}
