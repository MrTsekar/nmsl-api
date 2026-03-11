import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { ChatModule } from './modules/chat/chat.module';
import { MedicalResultsModule } from './modules/medical-results/medical-results.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';

import { User } from './modules/users/entities/user.entity';
import { Appointment } from './modules/appointments/entities/appointment.entity';
import { DoctorAvailability } from './modules/doctors/entities/doctor-availability.entity';
import { ChatConversation } from './modules/chat/entities/conversation.entity';
import { Message } from './modules/chat/entities/message.entity';
import { MedicalResult } from './modules/medical-results/entities/medical-result.entity';
import { Notification } from './modules/notifications/entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get<string>('DATABASE_USER', 'postgres'),
        password: config.get<string>('DATABASE_PASSWORD', ''),
        database: config.get<string>('DATABASE_NAME', 'nmsl_healthcare'),
        entities: [
          User,
          Appointment,
          DoctorAvailability,
          ChatConversation,
          Message,
          MedicalResult,
          Notification,
        ],
        synchronize: config.get<string>('DATABASE_SYNC') === 'true',
        logging: config.get<string>('NODE_ENV') !== 'production',
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    AuthModule,
    UsersModule,
    AppointmentsModule,
    DoctorsModule,
    ChatModule,
    MedicalResultsModule,
    NotificationsModule,
    AdminModule,
    FileUploadModule,
  ],
})
export class AppModule {}
