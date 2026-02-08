import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RequestLog } from 'src/schemas/request-log.schema';
import { LogsGateway } from '../../messages-logs/gateways/logs.gateway';

@Injectable()
export class SystemLogsService {
    constructor(
        @InjectModel('RequestLog') private requestLogModel: Model<RequestLog>,
        private logsGateway: LogsGateway,
    ) { }

    async createLog(data: any) {
        const log = new this.requestLogModel(data);
        const savedLog = await log.save();

        // Emit real-time system log
        this.logsGateway.sendNewSystemLog(savedLog);

        return savedLog;
    }

    async getLogs(filters: any) {
        const query: any = {};
        if (filters.method) query.method = filters.method;
        if (filters.statusCode) query.statusCode = filters.statusCode;
        if (filters.url) query.url = { $regex: filters.url, $options: 'i' };

        if (filters.dateFrom) query.createdAt = { $gte: new Date(filters.dateFrom) };
        if (filters.dateTo) query.createdAt = { ...query.createdAt || {}, $lte: new Date(filters.dateTo) };

        return this.requestLogModel.find(query)
            .populate('userId', 'name email')
            .populate('orgId', 'name')
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();
    }
}
