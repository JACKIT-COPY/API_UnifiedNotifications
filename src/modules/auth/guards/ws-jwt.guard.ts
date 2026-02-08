import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient<Socket>();
            const authHeader = client.handshake.headers.authorization || client.handshake.auth.token;

            if (!authHeader) {
                throw new WsException('No authorization header found');
            }

            const authToken = authHeader.split(' ')[1] || authHeader;
            const payload = await this.jwtService.verifyAsync(authToken);

            // Attach user to client
            client['user'] = payload;

            return true;
        } catch (err) {
            this.logger.error(`WS Authentication error: ${err.message}`);
            throw new WsException('Unauthorized access');
        }
    }
}
