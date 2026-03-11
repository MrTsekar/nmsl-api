import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../../users/services/users.service';
import { SignUpDto } from '../dto/sign-up.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UserRole } from '../../users/entities/user.entity';
import { EmailService } from '../../notifications/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signUp(dto: SignUpDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.PATIENT,
    });

    const token = this.generateToken(user.id, user.role);
    const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutPassword } = user as any;
    return { token, user: userWithoutPassword };
  }

  async signIn(dto: SignInDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const token = this.generateToken(user.id, user.role);
    const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutPassword } = user as any;
    return { token, user: userWithoutPassword };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { message: 'Password reset link sent to your email' };
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000);

    await this.usersService.updateRaw(user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    try {
      await this.emailService.sendPasswordReset(user.email, token);
    } catch (e) {
      console.error('Failed to send password reset email:', e.message);
    }

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    if (
      user.resetPasswordToken !== dto.token ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updateRaw(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return { message: 'Password reset successfully' };
  }

  private generateToken(userId: string, role: string): string {
    return this.jwtService.sign({ userId, role });
  }
}
