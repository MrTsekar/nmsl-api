import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from '../services/appointments.service';
import { AppointmentLockService } from '../services/appointment-lock.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
import { LockAppointmentDto } from '../dto/lock-appointment.dto';
import { UnlockAppointmentDto } from '../dto/unlock-appointment.dto';
import { AppointmentStatus } from '../entities/appointment.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../users/entities/user.entity';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly appointmentLockService: AppointmentLockService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get appointments (filtered by role)' })
  findAll(
    @CurrentUser() user: User,
    @Query('status') status?: AppointmentStatus,
    @Query('date') date?: string,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.appointmentsService.findAll(user, { status, date, doctorId, patientId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  @Post()
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Book a new appointment (patient only)' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: User) {
    return this.appointmentsService.create(dto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update appointment status' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: User,
  ) {
    return this.appointmentsService.update(id, dto, user);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule appointment' })
  reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser() user: User,
  ) {
    return this.appointmentsService.reschedule(id, dto, user);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm appointment (doctor/admin)' })
  async confirm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.appointmentsService.update(
      id,
      { status: AppointmentStatus.CONFIRMED },
      user,
    );
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel appointment' })
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.appointmentsService.update(
      id,
      { status: AppointmentStatus.CANCELLED },
      user,
    );
  }

  @Patch(':id/complete')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark appointment as completed (doctor/admin)' })
  async complete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.appointmentsService.update(
      id,
      { status: AppointmentStatus.COMPLETED },
      user,
    );
  }

  @Patch(':id/lock')
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
      user.name, // Pass admin name for audit logging
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

  @Patch(':id/unlock')
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

    return {
      success: true,
      message: 'Appointment unlocked successfully',
    };
  }

  @Get(':id/lock-status')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({
    summary: 'Check lock status of an appointment',
    description: 'Returns current lock information including remaining time.',
  })
  async getLockStatus(@Param('id') id: string) {
    const lockInfo = await this.appointmentLockService.getLock(id);
    const remainingSeconds = await this.appointmentLockService.getRemainingTime(id);

    return {
      isLocked: lockInfo !== null,
      lockInfo,
      remainingSeconds,
    };
  }
}
