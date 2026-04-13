import { IsDateString, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NigeriaLocation } from '../../services/entities/service.entity';

export class CheckDateAvailabilityDto {
  @ApiProperty({
    example: '2026-04-15',
    description: 'Date in YYYY-MM-DD format',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    enum: NigeriaLocation,
    example: NigeriaLocation.ABUJA,
    description: 'Location code',
  })
  @IsEnum(NigeriaLocation)
  location: NigeriaLocation;

  @ApiProperty({
    example: 'Cardiology',
    description: 'Medical specialty name',
  })
  @IsString()
  specialty: string;
}
