import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole, MedicalSpecialty } from '../../users/entities/user.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get admin dashboard KPIs' })
  getKpis() {
    return this.adminService.getKpis();
  }

  @Post('doctors')
  @ApiOperation({ summary: 'Create new doctor account' })
  createDoctor(@Body() dto: CreateDoctorDto) {
    return this.adminService.createDoctor(dto);
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiQuery({ name: 'specialty', required: false, enum: MedicalSpecialty })
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

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Activate or deactivate a user' })
  toggleStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }
}
