import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { ChangeAdminPasswordDto } from '../dto/change-admin-password.dto';
import { UpdateUserEmailDto } from '../dto/update-user-email.dto';
import { UpdateAppointmentStatusDto, RescheduleAppointmentAdminDto } from '../dto/update-appointment.dto';
import { UsersService } from '../../users/services/users.service';
import { DoctorsService } from '../../doctors/services/doctors.service';
import { EmailService } from '../../notifications/services/email.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly usersService: UsersService,
    private readonly doctorsService: DoctorsService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  // ─── KPIs ────────────────────────────────────────────────────────────────
  async getKpis() {
    const [totalUsers, totalDoctors, totalAppointments, pendingApprovals] =
      await Promise.all([
        this.usersRepository.count(),
        this.usersRepository.count({ where: { role: UserRole.DOCTOR } }),
        this.appointmentsRepository.count(),
        this.appointmentsRepository.count({
          where: { status: AppointmentStatus.PENDING },
        }),
      ]);

    return { totalUsers, totalDoctors, totalAppointments, pendingApprovals };
  }

  // ─── Doctors ─────────────────────────────────────────────────────────────
  async createDoctor(dto: CreateDoctorDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const doctor = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.DOCTOR,
    });
    await this.doctorsService.createDefaultAvailability(doctor.id);
    try { await this.emailService.sendWelcomeEmail(doctor); } catch (_) {}
    const { password, resetPasswordToken, resetPasswordExpires, ...safe } = doctor as any;
    return safe;
  }

  async getDoctors(query: {
    specialty?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    return this.usersService.findDoctors(query);
  }

  // ─── Admins ───────────────────────────────────────────────────────────────
  async getAdmins() {
    return this.usersService.findAdmins();
  }

  async createAdmin(dto: CreateAdminDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      role: dto.role ?? UserRole.ADMIN,
      phone: dto.phone ?? '',
      location: dto.location ?? '',
      state: dto.state ?? '',
    });
    const { password, resetPasswordToken, resetPasswordExpires, ...safe } = admin as any;
    return safe;
  }

  async toggleAdminStatus(id: string) {
    const user = await this.usersService.toggleStatus(id);
    return {
      success: true,
      message: user.isActive ? 'Admin activated successfully' : 'Admin deactivated successfully',
    };
  }

  async changeAdminPassword(id: string, dto: ChangeAdminPasswordDto) {
    await this.usersService.findById(id); // ensures existence
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updateRaw(id, { password: hashed } as any);
    return { success: true, message: 'Password updated successfully' };
  }

  async deleteAdmin(id: string) {
    await this.usersService.deleteUser(id);
    return { success: true, message: 'Admin removed successfully' };
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  async getUsers(query: { role?: string; location?: string }): Promise<User[]> {
    const users = await this.usersService.findPortalUsers(query);
    return users.map((u) => {
      const { password, resetPasswordToken, resetPasswordExpires, ...safe } = u as any;
      return safe;
    });
  }

  async toggleUserStatus(id: string) {
    const user = await this.usersService.toggleStatus(id);
    return {
      success: true,
      id: user.id,
      isActive: user.isActive,
      message: user.isActive ? 'User activated successfully' : 'User deactivated successfully',
    };
  }

  async sendUserPasswordReset(id: string) {
    const user = await this.usersService.findById(id);
    try { await this.emailService.sendPasswordReset(user.email, 'reset-link'); } catch (_) {}
    return { success: true, message: `Password reset link sent to ${user.email}` };
  }

  async updateUserEmail(id: string, dto: UpdateUserEmailDto) {
    await this.usersService.updateRaw(id, { email: dto.email } as any);
    return { success: true, message: 'Email updated successfully' };
  }

  // ─── Appointments ─────────────────────────────────────────────────────────
  async getAppointments(): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      order: { appointmentDate: 'DESC' },
    });
  }

  async updateAppointmentStatus(id: string, dto: UpdateAppointmentStatusDto, performedBy?: User): Promise<Appointment> {
    const appt = await this.appointmentsRepository.findOne({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');
    
    const oldStatus = appt.status;
    appt.status = dto.status as AppointmentStatus;
    const updated = await this.appointmentsRepository.save(appt);

    // Create audit log for confirmed/rejected/completed status changes
    if (performedBy && [AppointmentStatus.CONFIRMED, AppointmentStatus.REJECTED, AppointmentStatus.COMPLETED].includes(updated.status)) {
      const actionMap = {
        [AppointmentStatus.CONFIRMED]: AuditAction.ACCEPTED,
        [AppointmentStatus.REJECTED]: AuditAction.REJECTED,
        [AppointmentStatus.COMPLETED]: AuditAction.COMPLETED,
      };

      await this.auditService.createAuditLog({
        appointmentId: updated.id,
        patientName: updated.patientName,
        action: actionMap[updated.status],
        performedBy: performedBy.email,
        performedByName: performedBy.name,
        details: dto.reason || null,
      });
    }

    return updated;
  }

  async rescheduleAppointment(id: string, dto: RescheduleAppointmentAdminDto, performedBy?: User): Promise<Appointment> {
    const appt = await this.appointmentsRepository.findOne({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');
    
    appt.appointmentDate = dto.date;
    appt.appointmentTime = dto.time;
    appt.status = AppointmentStatus.RESCHEDULED;
    appt.rescheduleReason = dto.rescheduleReason ?? null;
    const updated = await this.appointmentsRepository.save(appt);

    // Create audit log for rescheduling
    if (performedBy) {
      await this.auditService.createAuditLog({
        appointmentId: updated.id,
        patientName: updated.patientName,
        action: AuditAction.RESCHEDULED,
        performedBy: performedBy.email,
        performedByName: performedBy.name,
        details: dto.rescheduleReason || null,
      });
    }

    return updated;
  }
}

