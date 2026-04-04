import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../../appointments/entities/appointment.entity';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: ['confirmed', 'rejected'] })
  @IsEnum(['confirmed', 'rejected'])
  status: 'confirmed' | 'rejected';
}

export class RescheduleAppointmentAdminDto {
  @ApiProperty({ example: '2026-04-05' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:00 AM' })
  @IsString()
  time: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rescheduleReason?: string;
}
