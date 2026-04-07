import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statistic } from '../entities/statistic.entity';

export class UpdateStatisticDto {
  id?: string;
  icon: string;
  value: string;
  label: string;
  description?: string;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Statistic)
    private readonly statisticsRepository: Repository<Statistic>,
  ) {}

  findAll(): Promise<Statistic[]> {
    return this.statisticsRepository.find();
  }

  async replaceAll(stats: UpdateStatisticDto[]): Promise<Statistic[]> {
    await this.statisticsRepository.clear();
    const entities = this.statisticsRepository.create(stats);
    return this.statisticsRepository.save(entities);
  }
}
