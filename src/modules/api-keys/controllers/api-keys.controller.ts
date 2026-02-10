import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard';
import { ApiKeysService } from '../services/api-keys.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, AdminGuard) // Only org admins can manage API keys (via dashboard)
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) { }

    /**
     * Generate a new API key.
     * Returns the plaintext key ONCE in the response — must be copied by the user immediately.
     */
    @Post()
    async create(@Body() createDto: CreateApiKeyDto, @Request() req) {
        return this.apiKeysService.generateKey(
            req.user.orgId,
            req.user.userId,
            createDto,
        );
    }

    /**
     * List all API keys for the current organization (safe view — no key hashes).
     */
    @Get()
    async list(@Request() req) {
        return this.apiKeysService.listKeys(req.user.orgId);
    }

    /**
     * Revoke (deactivate) an API key — it can no longer be used for authentication.
     */
    @Put(':id/revoke')
    async revoke(@Param('id') id: string, @Request() req) {
        return this.apiKeysService.revokeKey(id, req.user.orgId);
    }

    /**
     * Re-activate a previously revoked API key.
     */
    @Put(':id/activate')
    async activate(@Param('id') id: string, @Request() req) {
        return this.apiKeysService.activateKey(id, req.user.orgId);
    }

    /**
     * Permanently delete an API key.
     */
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req) {
        return this.apiKeysService.deleteKey(id, req.user.orgId);
    }
}
