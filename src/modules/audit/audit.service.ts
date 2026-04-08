import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createAuditLog(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      ...dto,
      performedAt: new Date(),
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(dto: GetAuditLogsDto, userEmail?: string, isAdmin: boolean = false) {
    const { startDate, endDate, officer, action, page = 1, limit = 20 } = dto;

    const where: FindOptionsWhere<AuditLog> = {};

    // If user is not admin, only show their own logs
    if (!isAdmin && userEmail) {
      where.performedBy = userEmail;
    } else if (officer) {
      where.performedBy = officer;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.performedAt = Between(
        startDate ? new Date(startDate) : new Date(0),
        endDate ? new Date(endDate) : new Date(),
      );
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { performedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOfficerStatistics(startDate?: string, endDate?: string) {
    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.performedBy', 'officerEmail')
      .addSelect('audit.performedByName', 'officerName')
      .addSelect('COUNT(*)', 'totalProcessed')
      .addSelect(
        "SUM(CASE WHEN audit.action = 'accepted' THEN 1 ELSE 0 END)",
        'accepted',
      )
      .addSelect(
        "SUM(CASE WHEN audit.action = 'rejected' THEN 1 ELSE 0 END)",
        'rejected',
      )
      .addSelect(
        "SUM(CASE WHEN audit.action = 'rescheduled' THEN 1 ELSE 0 END)",
        'rescheduled',
      )
      .addSelect(
        "SUM(CASE WHEN audit.action = 'completed' THEN 1 ELSE 0 END)",
        'completed',
      )
      .addSelect('MAX(audit.performedAt)', 'lastActive')
      .groupBy('audit.performedBy')
      .addGroupBy('audit.performedByName')
      .orderBy('totalProcessed', 'DESC');

    if (startDate || endDate) {
      query.where('audit.performedAt BETWEEN :startDate AND :endDate', {
        startDate: startDate ? new Date(startDate) : new Date(0),
        endDate: endDate ? new Date(endDate) : new Date(),
      });
    }

    const statistics = await query.getRawMany();

    return {
      statistics: statistics.map((stat) => ({
        officerEmail: stat.officerEmail,
        officerName: stat.officerName,
        totalProcessed: parseInt(stat.totalProcessed),
        accepted: parseInt(stat.accepted),
        rejected: parseInt(stat.rejected),
        rescheduled: parseInt(stat.rescheduled),
        completed: parseInt(stat.completed),
        lastActive: stat.lastActive,
      })),
      total: statistics.length,
    };
  }

  async getAuditLogsByAppointment(appointmentId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { appointmentId },
      order: { performedAt: 'DESC' },
    });
  }
}
