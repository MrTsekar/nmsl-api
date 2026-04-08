import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnlockAppointmentDto {
  @ApiProperty({ description: 'Email of the officer requesting the unlock' })
  @IsEmail()
  officerEmail: string;
}
