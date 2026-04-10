import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientCategory, ServiceType } from '../entities/testimonial.entity';

export class CreateTestimonialDto {
  @ApiPropertyOptional({ example: 'A.L.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  patientName?: string;

  @ApiProperty({ enum: PatientCategory, example: PatientCategory.STAFF })
  @IsEnum(PatientCategory)
  patientCategory: PatientCategory;

  @ApiProperty({ example: 'Great Experience' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'The doctors were very professional.' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.PHYSICAL_APPOINTMENT })
  @IsEnum(ServiceType)
  serviceType: ServiceType;
}
