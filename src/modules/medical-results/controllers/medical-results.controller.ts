import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MedicalResultsService } from '../services/medical-results.service';
import { CreateMedicalResultDto } from '../dto/create-medical-result.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../users/entities/user.entity';
import { MedicalResultStatus } from '../entities/medical-result.entity';

@ApiTags('Medical Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('results')
export class MedicalResultsController {
  constructor(private readonly medicalResultsService: MedicalResultsService) {}

  @Get()
  @ApiOperation({ summary: 'Get medical results (filtered by role)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: MedicalResultStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @CurrentUser() user: User,
    @Query('patientId') patientId?: string,
    @Query('status') status?: MedicalResultStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.medicalResultsService.findAll(user, { patientId, status, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medical result by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.medicalResultsService.findById(id, user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload medical result (doctor/admin only)' })
  create(
    @Body() dto: CreateMedicalResultDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.medicalResultsService.create(dto, file);
  }
}
