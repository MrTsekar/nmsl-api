import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AdminModule } from './modules/admin/admin.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { NmslServicesModule } from './modules/services/services.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { PartnersModule } from './modules/partners/partners.module';
import { BoardMembersModule } from './modules/board-members/board-members.module';
import { ContactModule } from './modules/contact/contact.module';
import { AuditModule } from './modules/audit/audit.module';

import { User } from './modules/users/entities/user.entity';
import { Appointment } from './modules/appointments/entities/appointment.entity';
import { DoctorAvailability } from './modules/doctors/entities/doctor-availability.entity';
import { Service } from './modules/services/entities/service.entity';
import { Statistic } from './modules/statistics/entities/statistic.entity';
import { Partner } from './modules/partners/entities/partner.entity';
import { BoardMember } from './modules/board-members/entities/board-member.entity';
import { ContactInfo } from './modules/contact/entities/contact-info.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';
import { redisConfig } from './config/redis.config';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'NMSL Healthcare API is running',
      version: '1.0',
      docs: '/api/docs',
    };
  }
}

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
          Service,
          Statistic,
          Partner,
          BoardMember,
          ContactInfo,
          AuditLog,
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

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: redisConfig,
    }),

    AuthModule,
    UsersModule,
    AppointmentsModule,
    DoctorsModule,
    AdminModule,
    AuditModule,
    FileUploadModule,
    NmslServicesModule,
    StatisticsModule,
    PartnersModule,
    BoardMembersModule,
    ContactModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
