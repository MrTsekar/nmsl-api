import { IsDateString, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2024-02-25' })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ example: '15:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'appointmentTime must be in HH:MM format',
  })
  appointmentTime: string;

  @ApiProperty({ example: 'Need to change due to personal reasons.' })
  @IsString()
  @MinLength(5)
  reason: string;
}
