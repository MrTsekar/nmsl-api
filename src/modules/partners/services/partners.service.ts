import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from '../entities/partner.entity';
import { CreatePartnerDto } from '../dto/create-partner.dto';
import { UpdatePartnerDto } from '../dto/update-partner.dto';
import { FileUploadService } from '../../file-upload/services/file-upload.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    @InjectRepository(Partner)
    private readonly partnersRepository: Repository<Partner>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  findAll(): Promise<Partner[]> {
    return this.partnersRepository.find({ order: { order: 'ASC' } });
  }

  findActive(): Promise<Partner[]> {
    return this.partnersRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Partner> {
    const partner = await this.partnersRepository.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
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

  async create(dto: CreatePartnerDto): Promise<Partner> {
    try {
      this.logger.log(`Creating new partner: ${dto.name}`);
      
      // Handle base64 image - upload to Azure and get URL
      let logoUrl = dto.logo;

      if (dto.logo && this.isBase64Image(dto.logo)) {
        this.logger.log('📦 Logo is base64, uploading to Azure...');
        const identifier = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
        logoUrl = await this.fileUploadService.uploadBase64Image(
          dto.logo,
          'partners',
          `logo-${identifier}`
        );
        this.logger.log(`✅ Logo uploaded: ${logoUrl}`);
      }

      const partner = this.partnersRepository.create({
        ...dto,
        logo: logoUrl,
      });
      
      const saved = await this.partnersRepository.save(partner);
      this.logger.log(`✅ Partner created successfully: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create partner: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create partner: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    try {
      this.logger.log(`Updating partner: ${id}`);
      const partner = await this.findOne(id);
      
      // Handle base64 image in updates
      let logoUrl = dto.logo;

      if (dto.logo && this.isBase64Image(dto.logo)) {
        this.logger.log('📦 Updating logo (base64), uploading to Azure...');
        const identifier = `${partner.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
        logoUrl = await this.fileUploadService.uploadBase64Image(
          dto.logo,
          'partners',
          `logo-${identifier}`
        );
        this.logger.log(`✅ Logo updated: ${logoUrl}`);
      }

      Object.assign(partner, {
        ...dto,
        ...(logoUrl && { logo: logoUrl }),
      });
      
      const updated = await this.partnersRepository.save(partner);
      this.logger.log(`✅ Partner updated successfully: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update partner ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const partner = await this.findOne(id);
    await this.partnersRepository.remove(partner);
    return { success: true };
  }

  async toggle(id: string): Promise<Partner> {
    const partner = await this.findOne(id);
    partner.isActive = !partner.isActive;
    return this.partnersRepository.save(partner);
  }
}
