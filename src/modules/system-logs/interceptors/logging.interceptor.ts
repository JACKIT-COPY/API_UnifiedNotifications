import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SystemLogsService } from '../services/system-logs.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    constructor(private systemLogsService: SystemLogsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        const response = httpContext.getResponse();

        const { method, originalUrl, ip, body, query, headers } = request;
        const userAgent = headers['user-agent'] || '';
        const startTime = Date.now();

        return next.handle().pipe(
            tap((data) => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;

                this.log(method, originalUrl, body, query, statusCode, duration, ip, userAgent, request.user, data);
            }),
            catchError((err) => {
                const duration = Date.now() - startTime;
                const statusCode = err.status || 500;

                this.log(method, originalUrl, body, query, statusCode, duration, ip, userAgent, request.user, null, err.message);
                return throwError(() => err);
            }),
        );
    }

    private log(
        method: string,
        url: string,
        body: any,
        query: any,
        statusCode: number,
        duration: number,
        ip: string,
        userAgent: string,
        user: any,
        responseData: any,
        error?: string,
    ) {
        // Sanitize sensitive info
        const sanitizedBody = { ...body };
        if (sanitizedBody.password) sanitizedBody.password = '********';
        if (sanitizedBody.token) sanitizedBody.token = '********';

        const logData = {
            method,
            url,
            body: sanitizedBody,
            query,
            statusCode,
            duration,
            ip,
            userAgent,
            userId: user?.id || user?._id || null,
            orgId: user?.orgId || null,
            response: responseData, // Careful with large responses
            error,
        };

        this.systemLogsService.createLog(logData).catch((err) => {
            this.logger.error(`Failed to save system log: ${err.message}`);
        });
    }
}
