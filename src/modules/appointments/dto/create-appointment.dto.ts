import {
  IsUUID,
  IsDateString,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum VisitType {
  PHYSICAL = 'Physical Visit',
  TELEMEDICINE = 'Telemedicine',
}

export class CreateAppointmentDto {
  @ApiProperty({ example: '2024-02-20' })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'appointmentTime must be in HH:MM format',
  })
  appointmentTime: string;

  @ApiProperty({ example: 'Regular checkup and blood pressure monitoring.' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;

  // Frontend booking form fields
  @ApiProperty({ enum: VisitType, example: 'Physical Visit' })
  @IsEnum(VisitType)
  visitType: string;

  @ApiProperty({ example: 'Abuja' })
  @IsString()
  location: string;

  @ApiProperty({ example: 'General Medicine' })
  @IsString()
  specialty: string;

  // Guest booking fields (when user not logged in)
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Need urgent consultation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isGuest?: boolean;
}
