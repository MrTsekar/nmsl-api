import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServicesService } from './services/services.service';
import { ServicesController } from './controllers/services.controller';
import { PublicServicesController } from './controllers/public-services.controller';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service]),
    FileUploadModule,
  ],
  controllers: [ServicesController, PublicServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class NmslServicesModule {}
