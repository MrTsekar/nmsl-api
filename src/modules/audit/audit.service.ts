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
    // Build the WHERE clause for date filtering
    let dateFilter = '';
    const params: any[] = [];
    
    if (startDate || endDate) {
      dateFilter = 'WHERE audit.performedAt BETWEEN $1 AND $2';
      params.push(startDate ? new Date(startDate) : new Date(0));
      params.push(endDate ? new Date(endDate) : new Date());
    }

    // Use a CTE to get only the latest action per appointment
    // This prevents counting an appointment as both 'accepted' and 'rescheduled'
    const query = `
      WITH latest_actions AS (
        SELECT DISTINCT ON (audit."appointmentId")
          audit.id,
          audit."appointmentId",
          audit.action,
          audit."performedBy",
          audit."performedByName",
          audit."performedAt"
        FROM audit_logs audit
        ${dateFilter}
        ORDER BY audit."appointmentId", audit."performedAt" DESC
      )
      SELECT
        la."performedBy" as "officerEmail",
        la."performedByName" as "officerName",
        COUNT(DISTINCT la."appointmentId")::int as "totalProcessed",
        SUM(CASE WHEN la.action = 'accepted' THEN 1 ELSE 0 END)::int as "accepted",
        SUM(CASE WHEN la.action = 'rejected' THEN 1 ELSE 0 END)::int as "rejected",
        SUM(CASE WHEN la.action = 'rescheduled' THEN 1 ELSE 0 END)::int as "rescheduled",
        SUM(CASE WHEN la.action = 'completed' THEN 1 ELSE 0 END)::int as "completed",
        MAX(la."performedAt") as "lastActive"
      FROM latest_actions la
      GROUP BY la."performedBy", la."performedByName"
      ORDER BY "totalProcessed" DESC
    `;

    const statistics = await this.auditLogRepository.query(query, params);

    return {
      statistics: statistics.map((stat) => ({
        officerEmail: stat.officerEmail,
        officerName: stat.officerName,
        totalProcessed: stat.totalProcessed,
        accepted: stat.accepted,
        rejected: stat.rejected,
        rescheduled: stat.rescheduled,
        completed: stat.completed,
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
