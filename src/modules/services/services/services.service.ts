import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const service = this.servicesRepository.create(dto);
    return this.servicesRepository.save(service);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, dto);
    return this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const service = await this.findOne(id);
    await this.servicesRepository.remove(service);
    return { success: true };
  }
}
