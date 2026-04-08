import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Audit')
@ApiBearerAuth('JWT')
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.APPOINTMENT_OFFICER)
  @ApiOperation({
    summary: 'Get audit logs',
    description:
      'Admins can see all logs. Appointment officers can only see their own logs.',
  })
  async getAuditLogs(@Query() dto: GetAuditLogsDto, @Req() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const userEmail = !isAdmin ? req.user.email : undefined;

    return this.auditService.getAuditLogs(dto, userEmail, isAdmin);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get officer performance statistics',
    description:
      'Returns statistics on appointment actions performed by each officer.',
  })
  async getOfficerStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getOfficerStatistics(startDate, endDate);
  }
}
