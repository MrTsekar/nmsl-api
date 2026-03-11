import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalResult, MedicalResultStatus } from '../entities/medical-result.entity';
import { CreateMedicalResultDto } from '../dto/create-medical-result.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { FileUploadService } from '../../file-upload/services/file-upload.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { UsersService } from '../../users/services/users.service';
import { ChatGateway } from '../../chat/gateways/chat.gateway';
import { EmailService } from '../../notifications/services/email.service';

@Injectable()
export class MedicalResultsService {
  constructor(
    @InjectRepository(MedicalResult)
    private readonly resultsRepository: Repository<MedicalResult>,
    private readonly fileUploadService: FileUploadService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly chatGateway: ChatGateway,
    private readonly emailService: EmailService,
  ) {}

  async findAll(
    currentUser: User,
    query: {
      patientId?: string;
      status?: MedicalResultStatus;
      page?: number;
      limit?: number;
    },
  ) {
    const { patientId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.resultsRepository
      .createQueryBuilder('r')
      .orderBy('r.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (currentUser.role === UserRole.PATIENT) {
      qb.where('r.patientId = :id', { id: currentUser.id });
    } else if (patientId) {
      qb.where('r.patientId = :patientId', { patientId });
    }

    if (status) qb.andWhere('r.status = :status', { status });

    const [results, total] = await qb.getManyAndCount();
    return { results, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id: string, currentUser: User): Promise<MedicalResult> {
    const result = await this.resultsRepository.findOne({ where: { id } });
    if (!result) throw new NotFoundException('Medical result not found');

    if (
      currentUser.role === UserRole.PATIENT &&
      result.patientId !== currentUser.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return result;
  }

  async create(
    dto: CreateMedicalResultDto,
    file: Express.Multer.File,
  ): Promise<MedicalResult> {
    const fileUrl = await this.fileUploadService.uploadFile(file, 'results');

    const result = this.resultsRepository.create({
      ...dto,
      fileUrl,
      fileType: file.mimetype,
    });
    const saved = await this.resultsRepository.save(result);

    try {
      const patient = await this.usersService.findById(dto.patientId);
      const notification = await this.notificationsService.create({
        userId: dto.patientId,
        type: NotificationType.NEW_RESULT,
        title: 'New Medical Result Available',
        message: `Your ${dto.testName} result from ${dto.labName} is now available.`,
        actionUrl: `/app/patient/results/${saved.id}`,
        metadata: { resultId: saved.id },
      });
      this.chatGateway.emitNotification(dto.patientId, notification);
      await this.emailService.sendResultUploaded(patient, dto.testName);
    } catch (e) {}

    return saved;
  }
}
