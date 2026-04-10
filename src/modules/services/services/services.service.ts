import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { FileUploadService } from '../../file-upload/services/file-upload.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    private readonly fileUploadService: FileUploadService,
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
      
      // Handle base64 images - upload to Azure and get URLs
      let bannerUrl = dto.bannerImageUrl;
      let iconUrl = dto.iconImageUrl;

      // Upload banner image if it's base64
      if (dto.bannerImageUrl && this.isBase64Image(dto.bannerImageUrl)) {
        this.logger.log('📦 Banner image is base64, uploading to Azure...');
        const identifier = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
        bannerUrl = await this.fileUploadService.uploadBase64Image(
          dto.bannerImageUrl,
          'services/banners',
          `banner-${identifier}`
        );
        this.logger.log(`✅ Banner uploaded: ${bannerUrl}`);
      } else if (dto.bannerImageUrl) {
        this.logger.debug(`Banner is already a URL: ${dto.bannerImageUrl.substring(0, 50)}...`);
      }

      // Upload icon image if it's base64
      if (dto.iconImageUrl && this.isBase64Image(dto.iconImageUrl)) {
        this.logger.log('📦 Icon image is base64, uploading to Azure...');
        const identifier = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
        iconUrl = await this.fileUploadService.uploadBase64Image(
          dto.iconImageUrl,
          'services/icons',
          `icon-${identifier}`
        );
        this.logger.log(`✅ Icon uploaded: ${iconUrl}`);
      } else if (dto.iconImageUrl) {
        this.logger.debug(`Icon is already a URL: ${dto.iconImageUrl.substring(0, 50)}...`);
      }

      // Create service with Azure URLs instead of base64
      const service = this.servicesRepository.create({
        ...dto,
        bannerImageUrl: bannerUrl,
        iconImageUrl: iconUrl,
      });
      
      const saved = await this.servicesRepository.save(service);
      
      this.logger.log(`✅ Service created successfully: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create service: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create service: ${error.message}`);
    }
  }

  /**
   * Check if a string is a base64 encoded image
   */
  private isBase64Image(str: string): boolean {
    if (!str) return false;
    // Check for data URL format
    if (str.startsWith('data:image/')) {
      return true;
    }
    // Check if it's a raw base64 string (very long string without http/https)
    if (!str.startsWith('http') && str.length > 1000) {
      return true;
    }
    return false;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    try {
      this.logger.log(`Updating service: ${id}`);
      const service = await this.findOne(id);
      
      // Handle base64 images in updates
      let bannerUrl = dto.bannerImageUrl;
      let iconUrl = dto.iconImageUrl;

      // Upload new banner if it's base64
      if (dto.bannerImageUrl && this.isBase64Image(dto.bannerImageUrl)) {
        this.logger.log('📦 Updating banner image (base64), uploading to Azure...');
        const identifier = `${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
        bannerUrl = await this.fileUploadService.uploadBase64Image(
          dto.bannerImageUrl,
          'services/banners',
          `banner-${identifier}`
        );
        this.logger.log(`✅ Banner updated: ${bannerUrl}`);
      }

      // Upload new icon if it's base64
      if (dto.iconImageUrl && this.isBase64Image(dto.iconImageUrl)) {
        this.logger.log('📦 Updating icon image (base64), uploading to Azure...');
        const identifier = `${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
        iconUrl = await this.fileUploadService.uploadBase64Image(
          dto.iconImageUrl,
          'services/icons',
          `icon-${identifier}`
        );
        this.logger.log(`✅ Icon updated: ${iconUrl}`);
      }

      // Update with new URLs
      Object.assign(service, {
        ...dto,
        ...(bannerUrl && { bannerImageUrl: bannerUrl }),
        ...(iconUrl && { iconImageUrl: iconUrl }),
      });
      
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
