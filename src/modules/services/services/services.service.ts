import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {}

  findAll(): Promise<Service[]> {
    return this.servicesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    try {
      this.logger.log(`Creating new service: ${dto.name}`);
      this.logger.debug(`Service data: category=${dto.category}, location=${dto.location}`);
      
      if (dto.bannerImageUrl) {
        this.logger.debug(`Banner image length: ${dto.bannerImageUrl.length} chars`);
      }
      if (dto.iconImageUrl) {
        this.logger.debug(`Icon image length: ${dto.iconImageUrl.length} chars`);
      }
      
      const service = this.servicesRepository.create(dto);
      const saved = await this.servicesRepository.save(service);
      
      this.logger.log(`✅ Service created successfully: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create service: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create service: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    try {
      this.logger.log(`Updating service: ${id}`);
      const service = await this.findOne(id);
      Object.assign(service, dto);
      const updated = await this.servicesRepository.save(service);
      this.logger.log(`✅ Service updated successfully: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update service ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting service: ${id}`);
    const service = await this.findOne(id);
    await this.servicesRepository.remove(service);
    this.logger.log(`✅ Service deleted: ${id}`);
    return { success: true };
  }
}
