import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'Appointment ID' })
  @IsNotEmpty()
  @IsString()
  appointmentId: string;

  @ApiProperty({ description: 'Patient name' })
  @IsNotEmpty()
  @IsString()
  patientName: string;

  @ApiProperty({ enum: AuditAction, description: 'Action performed' })
  @IsNotEmpty()
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({ description: 'Email of the officer who performed the action' })
  @IsNotEmpty()
  @IsString()
  performedBy: string;

  @ApiProperty({ description: 'Name of the officer who performed the action' })
  @IsNotEmpty()
  @IsString()
  performedByName: string;

  @ApiPropertyOptional({ description: 'Additional details about the action' })
  @IsOptional()
  @IsString()
  details?: string;
}
