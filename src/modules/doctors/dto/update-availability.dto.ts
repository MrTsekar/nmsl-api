import {
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
  ValidateNested,
  ValidateIf,
  IsObject,
  IsUUID,
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
  @ApiPropertyOptional({
    description: 'Doctor ID (optional, for validation)',
  })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

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
    example: { start: '09:00', end: '17:00' },
    description: 'Uniform time slot for all days (when useUniformTime is true)',
  })
  @ValidateIf((o) => o.useUniformTime === true)
  @ValidateNested()
  @Type(() => TimeSlot)
  @IsOptional()
  uniformTime?: TimeSlot;

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

