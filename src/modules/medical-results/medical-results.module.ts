import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalResult } from './entities/medical-result.entity';
import { MedicalResultsController } from './controllers/medical-results.controller';
import { MedicalResultsService } from './services/medical-results.service';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalResult]),
    FileUploadModule,
    NotificationsModule,
    UsersModule,
    ChatModule,
  ],
  controllers: [MedicalResultsController],
  providers: [MedicalResultsService],
  exports: [MedicalResultsService],
})
export class MedicalResultsModule {}
