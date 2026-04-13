import { IsUUID, IsDateString, IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignDoctorDto {
  @ApiProperty({ description: 'Doctor ID to assign', example: 'uuid-here' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ description: 'Appointment date', example: '2026-04-15' })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ description: 'Appointment time in HH:mm format', example: '10:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'appointmentTime must be in HH:MM format',
  })
  appointmentTime: string;

  @ApiPropertyOptional({ description: 'Optional reason for assignment/changes' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetAvailableDoctorsDto {
  @ApiProperty({ description: 'Appointment date', example: '2026-04-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Appointment time in HH:mm format', example: '10:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'time must be in HH:MM format',
  })
  time: string;

  @ApiProperty({ description: 'Medical specialty required' })
  @IsString()
  specialty: string;

  @ApiProperty({ description: 'Hospital location' })
  @IsString()
  location: string;
}
