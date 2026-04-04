import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Statistic } from './entities/statistic.entity';
import { StatisticsService } from './services/statistics.service';
import { StatisticsController } from './controllers/statistics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Statistic])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
