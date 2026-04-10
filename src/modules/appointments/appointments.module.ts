import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { DoctorAvailability } from '../doctors/entities/doctor-availability.entity';
import { AppointmentsController } from './controllers/appointments.controller';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentLockService } from './services/appointment-lock.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, DoctorAvailability]),
    UsersModule,
    NotificationsModule,
    ChatModule,
    AuditModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentLockService],
  exports: [AppointmentsService, AppointmentLockService],
})
export class AppointmentsModule {}
