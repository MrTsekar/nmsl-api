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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from '../services/appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
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
  constructor(private readonly appointmentsService: AppointmentsService) {}

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
}
