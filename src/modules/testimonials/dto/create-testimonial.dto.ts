import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestimonialCategory, ServiceType } from '../entities/testimonial.entity';

export class CreateTestimonialDto {
  @ApiPropertyOptional({ example: 'A.L.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  patientName?: string;

  @ApiProperty({ enum: TestimonialCategory, example: TestimonialCategory.STAFF })
  @IsEnum(TestimonialCategory)
  category: TestimonialCategory;

  @ApiProperty({ example: 'Excellent triage process' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'The triage process was quick and efficient.' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.PHYSICAL_APPOINTMENT })
  @IsEnum(ServiceType)
  serviceType: ServiceType;
}
