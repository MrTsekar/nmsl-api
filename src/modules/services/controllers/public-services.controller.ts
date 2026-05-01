import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServicesService } from '../services/services.service';

@ApiTags('Public — Services')
@Controller('services')
export class PublicServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active services (public endpoint)' })
  async findAllActive() {
    return this.servicesService.findAll();
  }
}
