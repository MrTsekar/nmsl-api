import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../common/decorators/match.decorator';

export class ChangePasswordDto {
  @ApiProperty({ 
    description: 'Current password for verification',
    example: 'Admin@123'
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({ 
    description: 'New password (minimum 6 characters)',
    minLength: 6,
    example: 'NewSecure@123'
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;

  @ApiProperty({ 
    description: 'Confirm new password (must match newPassword)',
    example: 'NewSecure@123'
  })
  @IsString()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmPassword: string;
}
