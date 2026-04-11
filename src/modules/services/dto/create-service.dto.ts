import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory, NigeriaLocation } from '../entities/service.entity';

export class KeyServiceDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;
}

export class CreateServiceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ServiceCategory })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiProperty({ 
    enum: NigeriaLocation,
    description: 'Service location - one of: Abuja, Lagos, Benin, Kaduna, Port Harcourt, Warri'
  })
  @IsEnum(NigeriaLocation, { 
    message: 'Location must be one of: Abuja, Lagos, Benin, Kaduna, Port Harcourt, Warri' 
  })
  location: NigeriaLocation;

  @ApiProperty()
  @IsString()
  shortDescription: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconImageUrl?: string;

  @ApiPropertyOptional({ type: [KeyServiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyServiceDto)
  keyServices?: KeyServiceDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
