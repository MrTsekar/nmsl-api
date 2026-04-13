import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
    // Check if email already exists
    const existingDoctor = await this.doctorsRepository.findOne({
      where: { email: dto.email },
    });
    
    if (existingDoctor) {
      throw new BadRequestException(
        `A doctor with email ${dto.email} already exists. Please use a different email address.`
      );
    }

    // Also check if email exists in users table
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    
    if (existingUser) {
      throw new BadRequestException(
        `Email ${dto.email} is already in use by another user (${existingUser.role}). Please use a different email address.`
      );
    }

    // Check if phone number already exists
    const existingDoctorPhone = await this.doctorsRepository.findOne({
      where: { phone: dto.phone },
    });
    
    if (existingDoctorPhone) {
      throw new BadRequestException(
        `A doctor with phone number ${dto.phone} already exists. Please use a different phone number.`
      );
    }

    // Also check if phone exists in users table
    const existingUserPhone = await this.usersRepository.findOne({
      where: { phone: dto.phone },
    });
    
    if (existingUserPhone) {
      throw new BadRequestException(
        `Phone number ${dto.phone} is already in use by another user (${existingUserPhone.role}). Please use a different phone number.`
      );
    }
    
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
    
    // Use UsersService.updateRaw which now has proper transaction handling
    const user = await this.usersService.findById(id);
    this.logger.debug(`Current password hash (first 10): ${user.password.substring(0, 10)}...`);
    
    // Hash new password
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    this.logger.debug(`New password length: ${dto.newPassword?.length}`);
    this.logger.debug(`New hashed password (first 10): ${hashed.substring(0, 10)}...`);
    
    // Update via UsersService which now uses QueryRunner transactions
    const updatedUser = await this.usersService.updateRaw(id, { password: hashed } as any);
    
    // Verify the password works
    const verifyUser = await this.usersService.findById(id);
    const testMatch = await bcrypt.compare(dto.newPassword, verifyUser.password);
    this.logger.log(`🔐 Password verification test: ${testMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!testMatch) {
      this.logger.error('❌ PASSWORD VERIFICATION FAILED');
      throw new Error('Password update failed verification');
    }
    
    this.logger.log(`✅ Admin password changed AND VERIFIED for: ${verifyUser.email}`);
    
    return { 
      success: true, 
      message: 'Password updated successfully. User should login with new password.',
      userEmail: verifyUser.email,
    };
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

  /**
   * Update appointment status - ACCEPT or REJECT an appointment
   * 
   * Flow:
   * - PENDING → CONFIRMED (accept) → Creates audit log "ACCEPTED"
   * - PENDING → REJECTED (reject) → Creates audit log "REJECTED"
   * 
   * Use rescheduleAppointment() for rescheduling instead
   * Do NOT use this to set CONFIRMED status unless actually accepting the appointment
   */
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

  /**
   * Reschedule an appointment to a new date/time
   * 
   * This automatically sets status to RESCHEDULED and creates audit log
   * Use this instead of updateAppointmentStatus() for rescheduling
   */
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

  /**
   * Get available doctors for an appointment
   * Filters doctors by specialty, location, and checks availability for the requested time
   */
  async getAvailableDoctorsForAppointment(
    specialty: string,
    location: string,
    date: string,
    time: string,
  ): Promise<Doctor[]> {
    // Get all doctors matching specialty and location who are active
    const doctors = await this.doctorsRepository.find({
      where: {
        specialty,
        location,
        isActive: true,
      },
    });

    // Get day of week from date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    // Filter by availability
    const availableDoctors: Doctor[] = [];

    for (const doctor of doctors) {
      // Get doctor's availability
      const availability = await this.doctorAvailabilityRepository.findOne({
        where: { doctorId: doctor.id },
      });

      // If no availability record, doctor is not available
      if (!availability) continue;

      // Check if doctor works on this day of week
      if (!availability.availableDays?.includes(dayOfWeek)) continue;

      // Check if the requested time is in the doctor's time slots
      if (!availability.timeSlots?.includes(time)) continue;

      // Check if the slot is already booked
      const isBooked = availability.bookedSlots?.some(
        (s) => s.date === date && s.time === time,
      );
      if (isBooked) continue;

      // Check if the slot is marked unavailable
      const isUnavailable = availability.unavailableSlots?.some(
        (s) => s.date === date && s.time === time,
      );
      if (isUnavailable) continue;

      // Doctor is available!
      availableDoctors.push(doctor);
    }

    return availableDoctors;
  }

  /**
   * Assign a doctor to an appointment
   * Updates the appointment with doctor info, date, and time
   */
  async assignDoctorToAppointment(
    appointmentId: string,
    doctorId: string,
    appointmentDate: string,
    appointmentTime: string,
    performedBy?: User,
  ): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Verify doctor is active
    if (!doctor.isActive) {
      throw new BadRequestException('Doctor is not active');
    }

    // Verify doctor matches appointment specialty and location
    if (doctor.specialty !== appointment.specialty) {
      throw new BadRequestException(
        `Doctor specialty (${doctor.specialty}) does not match appointment specialty (${appointment.specialty})`,
      );
    }

    if (doctor.location !== appointment.location) {
      throw new BadRequestException(
        `Doctor location (${doctor.location}) does not match appointment location (${appointment.location})`,
      );
    }

    // Check if doctor is available at the requested time
    const availability = await this.doctorAvailabilityRepository.findOne({
      where: { doctorId: doctor.id },
    });

    if (!availability) {
      throw new BadRequestException(
        'Doctor does not have availability schedule configured',
      );
    }

    // Check day of week
    const dayOfWeek = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    if (!availability.availableDays?.includes(dayOfWeek)) {
      throw new BadRequestException(
        `Doctor is not available on ${dayOfWeek}`,
      );
    }

    // Check if the requested time is in the doctor's time slots
    if (!availability.timeSlots?.includes(appointmentTime)) {
      throw new BadRequestException(
        'Doctor does not have this time slot in their schedule',
      );
    }

    // Check if the slot is already booked
    const isBooked = availability.bookedSlots?.some(
      (s) => s.date === appointmentDate && s.time === appointmentTime,
    );
    if (isBooked) {
      throw new BadRequestException(
        'Doctor already has a booked appointment at this time',
      );
    }

    // Check if the slot is marked unavailable
    const isUnavailable = availability.unavailableSlots?.some(
      (s) => s.date === appointmentDate && s.time === appointmentTime,
    );
    if (isUnavailable) {
      throw new BadRequestException(
        'Doctor is unavailable at the requested time',
      );
    }

    // Check for conflicting appointments
    const conflictingAppointment = await this.appointmentsRepository.findOne({
      where: {
        doctorId: doctor.id,
        appointmentDate,
        appointmentTime,
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (conflictingAppointment) {
      throw new BadRequestException(
        'Doctor already has a confirmed appointment at this time',
      );
    }

    // Assign doctor to appointment
    appointment.doctorId = doctor.id;
    appointment.doctorName = doctor.name;
    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;
    appointment.fee = 0; // Set default fee or calculate based on specialty

    const updated = await this.appointmentsRepository.save(appointment);

    // Add slot to booked slots
    const currentBooked = availability.bookedSlots || [];
    availability.bookedSlots = [
      ...currentBooked,
      { date: appointmentDate, time: appointmentTime, appointmentId: updated.id },
    ];
    await this.doctorAvailabilityRepository.save(availability);

    // Create audit log for doctor assignment
    if (performedBy) {
      await this.auditService.createAuditLog({
        appointmentId: updated.id,
        patientName: updated.patientName,
        action: 'DOCTOR_ASSIGNED' as AuditAction,
        performedBy: performedBy.email,
        performedByName: performedBy.name,
        details: `Assigned to Dr. ${doctor.name} on ${appointmentDate} at ${appointmentTime}`,
      });
    }

    return updated;
  }
}

