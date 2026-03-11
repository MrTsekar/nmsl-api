import {
  IsUUID,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicalResultStatus } from '../entities/medical-result.entity';

export class CreateMedicalResultDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ example: 'Full Blood Count' })
  @IsString()
  testName: string;

  @ApiProperty({ example: '2024-01-10' })
  @IsDateString()
  testDate: string;

  @ApiProperty({ example: '2024-01-12' })
  @IsDateString()
  resultDate: string;

  @ApiProperty({ example: 'Lagos Medical Laboratory' })
  @IsString()
  labName: string;

  @ApiProperty({ enum: MedicalResultStatus })
  @IsEnum(MedicalResultStatus)
  status: MedicalResultStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
