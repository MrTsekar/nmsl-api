import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { CreateDoctorDto } from '../../doctors/dto/create-doctor.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { ChangeAdminPasswordDto } from '../dto/change-admin-password.dto';
import { UpdateUserEmailDto } from '../dto/update-user-email.dto';
import { UpdateAppointmentStatusDto, RescheduleAppointmentAdminDto } from '../dto/update-appointment.dto';
import { UpdateAvailabilityDto } from '../../doctors/dto/update-availability.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { DoctorSpecialty } from '../../doctors/dto/create-doctor.dto';

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── KPIs ────────────────────────────────────────────────────────────────
  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({ summary: 'Get admin dashboard KPIs' })
  getKpis() {
    return this.adminService.getKpis();
  }

  // ─── Doctors ─────────────────────────────────────────────────────────────
  @Get('doctors')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiQuery({ name: 'specialty', required: false, enum: DoctorSpecialty })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getDoctors(
    @Query('specialty') specialty?: string,
    @Query('location') location?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getDoctors({ specialty, location, page, limit });
  }

  @Post('doctors')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new doctor account' })
  createDoctor(@Body() dto: CreateDoctorDto) {
    return this.adminService.createDoctor(dto);
  }

  @Get('doctors/:id/availability')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({ summary: "Get doctor's availability" })
  getDoctorAvailability(@Param('id') id: string) {
    return this.adminService.getDoctorAvailability(id);
  }

  @Patch('doctors/:id/availability')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update doctor's availability" })
  updateDoctorAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateDoctorAvailability(id, dto, user);
  }

  @Patch('doctors/:id/toggle-status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle doctor active status' })
  toggleDoctorStatus(@Param('id') id: string) {
    return this.adminService.toggleDoctorStatus(id);
  }

  // ─── Admins ───────────────────────────────────────────────────────────────
  @Get('admins')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all admins & appointment officers' })
  getAdmins() {
    return this.adminService.getAdmins();
  }

  @Post('admins')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new admin or appointment officer' })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @Patch('admins/:id/toggle-status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle admin active status' })
  toggleAdminStatus(@Param('id') id: string) {
    return this.adminService.toggleAdminStatus(id);
  }

  @Patch('admins/:id/password')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change admin password' })
  changeAdminPassword(
    @Param('id') id: string,
    @Body() dto: ChangeAdminPasswordDto,
  ) {
    return this.adminService.changeAdminPassword(id, dto);
  }

  @Delete('admins/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an admin' })
  deleteAdmin(@Param('id') id: string) {
    return this.adminService.deleteAdmin(id);
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({ summary: 'Get all portal users' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'location', required: false })
  getUsers(
    @Query('role') role?: string,
    @Query('location') location?: string,
  ) {
    return this.adminService.getUsers({ role, location });
  }

  @Patch('users/:id/toggle-status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle user active status' })
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Post('users/:id/reset-password')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset to user' })
  sendUserPasswordReset(@Param('id') id: string) {
    return this.adminService.sendUserPasswordReset(id);
  }

  @Patch('users/:id/email')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user email' })
  updateUserEmail(@Param('id') id: string, @Body() dto: UpdateUserEmailDto) {
    return this.adminService.updateUserEmail(id, dto);
  }

  // ─── Appointments ─────────────────────────────────────────────────────────
  @Get('appointments')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({ summary: 'Get all appointments (admin view)' })
  getAppointments() {
    return this.adminService.getAppointments();
  }

  @Patch('appointments/:id/status')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({ summary: 'Update appointment status (confirm/reject)' })
  updateAppointmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateAppointmentStatus(id, dto, user);
  }

  @Patch('appointments/:id/reschedule')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({ summary: 'Reschedule an appointment' })
  rescheduleAppointment(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentAdminDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.rescheduleAppointment(id, dto, user);
  }
}

