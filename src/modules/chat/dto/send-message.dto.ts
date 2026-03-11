import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'Hello doctor, I have a question.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
