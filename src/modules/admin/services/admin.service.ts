import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { DoctorAvailability } from '../../doctors/entities/doctor-availability.entity';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { CreateDoctorDto } from '../../doctors/dto/create-doctor.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { ChangeAdminPasswordDto } from '../dto/change-admin-password.dto';
import { UpdateUserEmailDto } from '../dto/update-user-email.dto';
import { UpdateAppointmentStatusDto, RescheduleAppointmentAdminDto } from '../dto/update-appointment.dto';
import { UpdateAvailabilityDto } from '../../doctors/dto/update-availability.dto';
import { UsersService } from '../../users/services/users.service';
import { DoctorsService } from '../../doctors/services/doctors.service';
import { EmailService } from '../../notifications/services/email.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorsRepository: Repository<Doctor>,
    @InjectRepository(DoctorAvailability)
    private readonly doctorAvailabilityRepository: Repository<DoctorAvailability>,
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
        this.doctorsRepository.count(),
        this.appointmentsRepository.count(),
        this.appointmentsRepository.count({
          where: { status: AppointmentStatus.PENDING },
        }),
      ]);

    return { totalUsers, totalDoctors, totalAppointments, pendingApprovals };
  }

  // ─── Doctors ─────────────────────────────────────────────────────────────
  async createDoctor(dto: CreateDoctorDto): Promise<Doctor> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    // Create doctor record
    const doctor = this.doctorsRepository.create({
      ...dto,
      password: hashedPassword,
      isActive: true,
    });
    
    const savedDoctor = await this.doctorsRepository.save(doctor);
    
    // Create default availability (empty - unavailable by default)
    const availability = this.doctorAvailabilityRepository.create({
      doctor: savedDoctor,
      days: [],
      useUniformTime: true,
      uniformTimeStart: null,
      uniformTimeEnd: null,
      customTimes: null,
    });
    
    await this.doctorAvailabilityRepository.save(availability);
    
    try {
      await this.emailService.sendWelcomeEmail({
        email: savedDoctor.email,
        name: savedDoctor.name,
      } as any);
    } catch (_) {}
    
    const { password, ...safe } = savedDoctor;
    return safe as Doctor;
  }

  async getDoctors(query: {
    specialty?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    const { specialty, location, page = 1, limit = 20 } = query;
    
    const queryBuilder = this.doctorsRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.availabilitySchedule', 'availability');
    
    if (specialty) {
      queryBuilder.where('doctor.specialty = :specialty', { specialty });
    }
    
    if (location) {
      queryBuilder.andWhere('doctor.location = :location', { location });
    }
    
    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('doctor.createdAt', 'DESC');
    
    const [doctors, total] = await queryBuilder.getManyAndCount();
    
    return {
      doctors: doctors.map((doctor) => {
        const { password, ...safeDoctor } = doctor as any;
        
        // Format availabilitySchedule to match frontend expectations
        if (safeDoctor.availabilitySchedule) {
          const avail = safeDoctor.availabilitySchedule;
          safeDoctor.availabilitySchedule = {
            doctorId: avail.doctorId,
            days: avail.days || [],
            useUniformTime: avail.useUniformTime,
            uniformTime: avail.useUniformTime && avail.uniformTimeStart && avail.uniformTimeEnd
              ? { start: avail.uniformTimeStart, end: avail.uniformTimeEnd }
              : null,
            customTimes: !avail.useUniformTime ? avail.customTimes : null,
          };
        }
        
        return safeDoctor;
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDoctorAvailability(doctorId: string): Promise<DoctorAvailability> {
    return this.doctorsService.getAvailability(doctorId);
  }

  async updateDoctorAvailability(
    doctorId: string,
    dto: UpdateAvailabilityDto,
    currentUser: User,
  ): Promise<DoctorAvailability> {
    return this.doctorsService.updateAvailability(doctorId, dto, currentUser);
  }

  async toggleDoctorStatus(id: string) {
    const doctor = await this.doctorsRepository.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    
    doctor.isActive = !doctor.isActive;
    await this.doctorsRepository.save(doctor);
    
    return {
      success: true,
      id: doctor.id,
      isActive: doctor.isActive,
      message: doctor.isActive ? 'Doctor activated successfully' : 'Doctor deactivated successfully',
    };
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
    this.logger.log(`🔄 Admin password change for user: ${id}`);
    await this.usersService.findById(id); // ensures existence
    this.logger.debug(`New password length: ${dto.newPassword?.length}`);
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    this.logger.debug(`Hashed password (first 10 chars): ${hashed.substring(0, 10)}...`);
    await this.usersService.updateRaw(id, { password: hashed } as any);
    this.logger.log(`✅ Admin password changed successfully for user: ${id}`);
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

    // Send email notifications when appointment is accepted or rejected
    if (updated.status === AppointmentStatus.CONFIRMED) {
      // Send confirmation email to patient
      await this.emailService.sendAppointmentAcceptedToPatient(updated);
      
      // Get doctor's email and send notification
      const doctor = await this.doctorsRepository.findOne({ where: { id: updated.doctorId } });
      if (doctor) {
        await this.emailService.sendAppointmentAcceptedToDoctor(updated, doctor.email);
      }
    } else if (updated.status === AppointmentStatus.REJECTED) {
      // Send rejection email to patient with reason
      await this.emailService.sendAppointmentRejectedToPatient(updated, dto.reason);
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

