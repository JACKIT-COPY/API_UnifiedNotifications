import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SystemLogsService } from '../services/system-logs.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    constructor(private systemLogsService: SystemLogsService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, ip, body, query, headers } = req;
        const userAgent = headers['user-agent'] || '';
        const startTime = Date.now();

        // Intercept the response
        const rawResponse = res.write;
        const rawResponseEnd = res.end;
        const chunks: any[] = [];

        // We can't easily capture the response body without a lot of overhead, 
        // but we can capture the status code and duration.
        // If we really want the response body, we can override res.write and res.end.

        res.on('finish', () => {
            const { statusCode } = res;
            const duration = Date.now() - startTime;

            // Deep copy body to avoid mutation issues, and remove sensitive fields
            const sanitizedBody = { ...body };
            if (sanitizedBody.password) sanitizedBody.password = '********';
            if (sanitizedBody.token) sanitizedBody.token = '********';

            const logData = {
                method,
                url: originalUrl,
                body: sanitizedBody,
                query,
                statusCode,
                duration,
                ip,
                userAgent,
                userId: (req as any).user?.id || (req as any).user?._id,
                orgId: (req as any).user?.orgId,
            };

            // Store in DB asynchronously
            this.systemLogsService.createLog(logData).catch(err => {
                this.logger.error(`Failed to save log: ${err.message}`);
            });
        });

        next();
    }
}
