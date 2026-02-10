import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKeySchema } from 'src/schemas/api-key.schema';
import { ApiKeysService } from './services/api-keys.service';
import { ApiKeysController } from './controllers/api-keys.controller';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'ApiKey', schema: ApiKeySchema }]),
    ],
    controllers: [ApiKeysController],
    providers: [ApiKeysService],
    exports: [ApiKeysService], // Exported so CombinedAuthGuard can inject it
})
export class ApiKeysModule { }
