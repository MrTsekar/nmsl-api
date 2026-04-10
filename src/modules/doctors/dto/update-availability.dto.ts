import {
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
  ValidateNested,
  ValidateIf,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class TimeSlot {
  @ApiProperty({ example: '09:00' })
  @IsString()
  start: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  end: string;
}

export class UpdateAvailabilityDto {
  @ApiProperty({
    example: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    description: 'Days of the week when doctor is available',
  })
  @IsArray()
  @IsString({ each: true })
  days: string[];

  @ApiProperty({
    example: true,
    description: 'Whether to use uniform time across all days',
  })
  @IsBoolean()
  useUniformTime: boolean;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Uniform start time (HH:mm format)',
  })
  @ValidateIf((o) => o.useUniformTime === true)
  @IsString()
  @IsOptional()
  uniformTimeStart?: string;

  @ApiPropertyOptional({
    example: '17:00',
    description: 'Uniform end time (HH:mm format)',
  })
  @ValidateIf((o) => o.useUniformTime === true)
  @IsString()
  @IsOptional()
  uniformTimeEnd?: string;

  @ApiPropertyOptional({
    example: {
      monday: { start: '08:00', end: '14:00' },
      wednesday: { start: '09:00', end: '15:00' },
      friday: { start: '10:00', end: '16:00' },
    },
    description: 'Custom times for each day (when useUniformTime is false)',
  })
  @ValidateIf((o) => o.useUniformTime === false)
  @IsObject()
  @IsOptional()
  customTimes?: Record<string, TimeSlot>;

  // Legacy fields for backward compatibility (to be deprecated)
  @ApiPropertyOptional({
    example: ['monday', 'tuesday', 'wednesday'],
    description: '(DEPRECATED) Use "days" instead',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableDays?: string[];

  @ApiPropertyOptional({
    example: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    description: '(DEPRECATED) Predefined time slots',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  timeSlots?: string[];
}

