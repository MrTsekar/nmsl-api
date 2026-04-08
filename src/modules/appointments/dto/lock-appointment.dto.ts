import { IsBoolean, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LockAppointmentDto {
  @ApiProperty({ description: 'Email of the officer requesting the lock' })
  @IsEmail()
  officerEmail: string;

  @ApiPropertyOptional({ description: 'Whether the requester is an admin (can override locks)', default: false })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
