import {
  IsUUID,
  IsDateString,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-of-doctor' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ example: '2024-02-20' })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'appointmentTime must be in HH:MM format',
  })
  appointmentTime: string;

  @ApiProperty({ example: 'Regular checkup and blood pressure monitoring.' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
