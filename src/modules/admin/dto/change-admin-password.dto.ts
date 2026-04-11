import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../common/decorators/match.decorator';

export class ChangeAdminPasswordDto {
  @ApiProperty({ 
    description: 'New password for the admin (minimum 8 characters)',
    minLength: 8,
    example: 'SecureAdmin@123'
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

  @ApiProperty({ 
    description: 'Confirm new password (must match newPassword)',
    example: 'SecureAdmin@123'
  })
  @IsString()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmPassword: string;
}
