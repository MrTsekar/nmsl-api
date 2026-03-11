import {
  IsArray,
  IsString,
  IsOptional,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class UpdateAvailabilityDto {
  @ApiPropertyOptional({
    example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableDays?: string[];

  @ApiPropertyOptional({
    example: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  timeSlots?: string[];
}
