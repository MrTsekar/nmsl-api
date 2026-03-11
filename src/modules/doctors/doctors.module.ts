import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorAvailability } from './entities/doctor-availability.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { DoctorsController } from './controllers/doctors.controller';
import { DoctorsService } from './services/doctors.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorAvailability, Appointment]),
    UsersModule,
    NotificationsModule,
    ChatModule,
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
