import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
