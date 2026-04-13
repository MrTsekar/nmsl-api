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
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { AppointmentLockService } from '../../appointments/services/appointment-lock.service';
import { CreateDoctorDto } from '../../doctors/dto/create-doctor.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { ChangeAdminPasswordDto } from '../dto/change-admin-password.dto';
import { UpdateUserEmailDto } from '../dto/update-user-email.dto';
import { UpdateAppointmentStatusDto, RescheduleAppointmentAdminDto } from '../dto/update-appointment.dto';
import { UpdateAvailabilityDto } from '../../doctors/dto/update-availability.dto';
import { LockAppointmentDto } from '../../appointments/dto/lock-appointment.dto';
import { AssignDoctorDto } from '../dto/assign-doctor.dto';
import { UnlockAppointmentDto } from '../../appointments/dto/unlock-appointment.dto';
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
  constructor(
    private readonly adminService: AdminService,
    private readonly appointmentsService: AppointmentsService,
    private readonly appointmentLockService: AppointmentLockService,
  ) {}

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

  @Post('appointments/:id/lock')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lock appointment for processing',
    description:
      'Lock an appointment to prevent other officers from working on it. Admins can override existing locks.',
  })
  async lockAppointment(
    @Param('id') id: string,
    @Body() dto: LockAppointmentDto,
    @CurrentUser() user: User,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    const lockInfo = await this.appointmentLockService.acquireLock(
      id,
      dto.officerEmail || user.email,
      dto.isAdmin || isAdmin,
      user.name,
    );

    // Update appointment entity with lock info
    await this.appointmentsService.updateLockFields(
      id,
      lockInfo.lockedBy,
      lockInfo.lockedAt,
    );

    const appointment = await this.appointmentsService.findById(id);
    return {
      ...appointment,
      lockInfo: {
        ...lockInfo,
        remainingSeconds: await this.appointmentLockService.getRemainingTime(id),
      },
    };
  }

  @Post('appointments/:id/unlock')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlock appointment',
    description:
      'Release the lock on an appointment. Officers can only unlock their own appointments unless they are admins.',
  })
  async unlockAppointment(
    @Param('id') id: string,
    @Body() dto: UnlockAppointmentDto,
    @CurrentUser() user: User,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    const officerEmail = dto.officerEmail || user.email;

    // Verify permission to unlock
    const canUnlock = await this.appointmentLockService.canUnlock(
      id,
      officerEmail,
      isAdmin,
    );

    if (!canUnlock) {
      throw new HttpException(
        'You do not have permission to unlock this appointment',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.appointmentLockService.releaseLock(id);

    // Clear lock fields in appointment entity
    await this.appointmentsService.updateLockFields(id, null, null);

    const appointment = await this.appointmentsService.findById(id);
    return {
      ...appointment,
      lockInfo: null,
    };
  }

  @Get('appointments/:id/available-doctors')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({
    summary: 'Get available doctors for an appointment',
    description:
      'Returns doctors who match the appointment specialty/location and are available at the requested date/time',
  })
  @ApiQuery({ name: 'date', required: true, description: 'Appointment date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'time', required: true, description: 'Appointment time (HH:mm)' })
  async getAvailableDoctors(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('time') time: string,
  ) {
    const appointment = await this.appointmentsService.findById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.adminService.getAvailableDoctorsForAppointment(
      appointment.specialty,
      appointment.location,
      date,
      time,
    );
  }

  @Patch('appointments/:id/assign-doctor')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({
    summary: 'Assign a doctor to an appointment',
    description:
      'Assigns a doctor to a pending appointment and sets the appointment date/time',
  })
  async assignDoctor(
    @Param('id') id: string,
    @Body() dto: AssignDoctorDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.assignDoctorToAppointment(
      id,
      dto.doctorId,
      dto.appointmentDate,
      dto.appointmentTime,
      user,
    );
  }
}

