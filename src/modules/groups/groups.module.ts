import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupsController } from './controllers/groups/groups.controller';
import { GroupsService } from './services/groups/groups.service';
import { GroupSchema } from 'src/schemas/group.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Group', schema: GroupSchema }])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}