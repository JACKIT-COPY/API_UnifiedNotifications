// src/modules/auth/guards/combined-auth.guard.ts
//
// Tries API key auth first (query param or header), then falls back to JWT.
// This allows both dashboard users (JWT) and external developers (API key)
// to access the same endpoints seamlessly.
//
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiKeysService } from 'src/modules/api-keys/services/api-keys.service';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
    private readonly logger = new Logger(CombinedAuthGuard.name);

    constructor(
        private readonly apiKeysService: ApiKeysService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // ── Strategy 1: API Key (query param or header) ──
        const apiKey =
            request.query?.apikey ||
            request.headers['unified-api-key'];

        if (apiKey) {
            const result = await this.apiKeysService.validateKey(apiKey);

            if (!result) {
                throw new UnauthorizedException('Invalid or expired API key');
            }

            // Populate req.user with the same shape as JWT auth
            request.user = {
                userId: result.userId,
                orgId: result.orgId,
                role: 'apikey', // Distinct role so guards/controllers can differentiate
                permissions: result.permissions,
                authMethod: 'apikey',
                keyId: result.keyId,
            };

            return true;
        }

        // ── Strategy 2: JWT Bearer Token ──
        const authHeader = request.headers['authorization'];

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            try {
                const payload = await this.jwtService.verifyAsync(token, {
                    secret: this.configService.get('JWT_SECRET'),
                });

                request.user = {
                    userId: payload.userId,
                    orgId: payload.orgId,
                    role: payload.role,
                    authMethod: 'jwt',
                };

                return true;
            } catch (err) {
                this.logger.warn(`JWT validation failed: ${err.message}`);
                throw new UnauthorizedException('Invalid or expired token');
            }
        }

        // ── No credentials provided ──
        throw new UnauthorizedException(
            'Authentication required. Provide an API key (query param "apikey" or header "X-API-Key") or a Bearer token.',
        );
    }
}
