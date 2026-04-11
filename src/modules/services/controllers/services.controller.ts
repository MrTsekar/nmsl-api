import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from '../services/services.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { FileUploadService } from '../../file-upload/services/file-upload.service';

@ApiTags('Admin — Services')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get('upload-url')
  @ApiOperation({ summary: 'Get upload URL for service images (direct Azure upload)' })
  @ApiQuery({ name: 'filename', required: true, example: 'banner.jpg' })
  @ApiQuery({ name: 'type', required: true, enum: ['banner', 'icon'], example: 'banner' })
  @ApiQuery({ name: 'contentType', required: false, example: 'image/jpeg' })
  async getUploadUrl(
    @Query('filename') filename: string,
    @Query('type') type: 'banner' | 'icon',
    @Query('contentType') contentType?: string,
  ) {
    const folder = type === 'banner' ? 'services/banners' : 'services/icons';
    return this.fileUploadService.generateUploadUrl(folder, filename, contentType);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
