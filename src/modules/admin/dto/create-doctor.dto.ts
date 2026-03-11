import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicalSpecialty } from '../../users/entities/user.entity';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Dr. Michael Chen' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'michael.chen@nmsl.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Abuja' })
  @IsString()
  location: string;

  @ApiProperty({ example: 'FCT' })
  @IsString()
  state: string;

  @ApiProperty({ example: '10 Medical Drive, Abuja' })
  @IsString()
  address: string;

  @ApiProperty({ enum: MedicalSpecialty })
  @IsEnum(MedicalSpecialty)
  specialty: MedicalSpecialty;

  @ApiProperty({ example: 'MBBS, MD (Cardiology)' })
  @IsString()
  qualifications: string;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  yearsOfExperience?: number;

  @ApiProperty({ example: 8000 })
  @IsNumber()
  @Type(() => Number)
  consultationFee: number;
}
