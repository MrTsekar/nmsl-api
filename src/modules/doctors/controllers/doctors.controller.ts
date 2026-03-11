import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
