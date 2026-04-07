import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class ServicesService {
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
    const keyServices = (dto.keyServices || []).map((ks) => ({
      id: ks.id || uuidv4(),
      name: ks.name,
      description: ks.description,
    }));
    const service = this.servicesRepository.create({ ...dto, keyServices });
    return this.servicesRepository.save(service);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    if (dto.keyServices) {
      dto.keyServices = dto.keyServices.map((ks) => ({
        id: ks.id || uuidv4(),
        name: ks.name,
        description: ks.description,
      }));
    }
    Object.assign(service, dto);
    return this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const service = await this.findOne(id);
    await this.servicesRepository.remove(service);
    return { success: true };
  }
}
