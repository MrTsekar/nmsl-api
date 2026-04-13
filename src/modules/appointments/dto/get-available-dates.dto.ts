import { IsDateString, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NigeriaLocation } from '../../services/entities/service.entity';

export class GetAvailableDatesDto {
  @ApiProperty({
    example: '2026-04-14',
    description: 'Start date in YYYY-MM-DD format',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2026-05-14',
    description: 'End date in YYYY-MM-DD format',
  })
  @IsDateString()
  endDate: string;

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
