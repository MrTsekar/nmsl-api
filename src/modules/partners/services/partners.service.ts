import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from '../entities/partner.entity';
import { CreatePartnerDto } from '../dto/create-partner.dto';
import { UpdatePartnerDto } from '../dto/update-partner.dto';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnersRepository: Repository<Partner>,
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

  create(dto: CreatePartnerDto): Promise<Partner> {
    const partner = this.partnersRepository.create(dto);
    return this.partnersRepository.save(partner);
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    Object.assign(partner, dto);
    return this.partnersRepository.save(partner);
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
