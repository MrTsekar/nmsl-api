import { IsArray, ValidateNested, IsDateString, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnavailableSlotDto {
  @ApiProperty({ example: '2024-02-22' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  time: string;

  @ApiPropertyOptional({ example: 'Personal appointment' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class MarkUnavailableDto {
  @ApiProperty({ type: [UnavailableSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnavailableSlotDto)
  slots: UnavailableSlotDto[];
}
