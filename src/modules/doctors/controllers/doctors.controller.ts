import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DoctorsService } from '../services/doctors.service';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { MarkUnavailableDto } from '../dto/mark-unavailable.dto';
import { CheckAvailabilityDto } from '../dto/check-availability.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../users/entities/user.entity';

@ApiTags('Doctors / Availability')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all doctors (with optional filters)' })
  @ApiQuery({ name: 'location', required: false, example: 'Abuja' })
  @ApiQuery({ name: 'specialty', required: false, example: 'General Medicine' })
  findAll(
    @Query('location') location?: string,
    @Query('specialty') specialty?: string,
  ) {
    return this.doctorsService.findAll({ location, specialty });
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all hospital locations' })
  getLocations() {
    return this.doctorsService.getLocations();
  }

  @Get('specialties')
  @ApiOperation({ summary: 'Get all medical specialties' })
  getSpecialties() {
    return this.doctorsService.getSpecialties();
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available time slots for a doctor on a specific date' })
  @ApiQuery({ name: 'doctorId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2026-04-15' })
  getAvailableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getAvailableSlots(doctorId, date);
  }

  @Get('search-available-slots')
  @ApiOperation({ summary: 'Find available slots across all doctors by location + specialty + date' })
  @ApiQuery({ name: 'location', required: true, example: 'Abuja' })
  @ApiQuery({ name: 'specialty', required: true, example: 'General Medicine' })
  @ApiQuery({ name: 'date', required: true, example: '2026-04-15' })
  searchAvailableSlots(
    @Query('location') location: string,
    @Query('specialty') specialty: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.searchAvailableSlots(location, specialty, date);
  }

  @Get('availability/:doctorId')
  @ApiOperation({ summary: "Get doctor's availability by ID" })
  getAvailability(@Param('doctorId') doctorId: string) {
    return this.doctorsService.getAvailability(doctorId);
  }

  @Get('availability/by-name/:doctorName')
  @ApiOperation({ summary: "Get doctor's availability by name" })
  getAvailabilityByName(@Param('doctorName') doctorName: string) {
    return this.doctorsService.getAvailabilityByName(doctorName);
  }

  @Post('availability/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a time slot is available' })
  checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.doctorsService.checkAvailability(dto);
  }

  @Patch('availability/:doctorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update doctor's availability (doctor/admin only)" })
  updateAvailability(
    @Param('doctorId') doctorId: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: User,
  ) {
    return this.doctorsService.updateAvailability(doctorId, dto, user);
  }

  @Post('availability/:doctorId/mark-unavailable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark time slots as unavailable (triggers conflict detection)' })
  markUnavailable(
    @Param('doctorId') doctorId: string,
    @Body() dto: MarkUnavailableDto,
    @CurrentUser() user: User,
  ) {
    return this.doctorsService.markUnavailable(doctorId, dto, user);
  }
}
