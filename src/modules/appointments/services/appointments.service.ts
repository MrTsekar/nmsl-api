import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Appointment,
  AppointmentStatus,
} from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { DoctorAvailability } from '../../doctors/entities/doctor-availability.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { ChatService } from '../../chat/services/chat.service';
import { EmailService } from '../../notifications/services/email.service';
import { ChatGateway } from '../../chat/gateways/chat.gateway';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(DoctorAvailability)
    private readonly availabilityRepository: Repository<DoctorAvailability>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly chatService: ChatService,
    private readonly emailService: EmailService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async findAll(
    currentUser: User,
    query: {
      status?: AppointmentStatus;
      date?: string;
      doctorId?: string;
      patientId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, date, doctorId, patientId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.appointmentsRepository
      .createQueryBuilder('a')
      .orderBy('a.appointmentDate', 'DESC')
      .addOrderBy('a.appointmentTime', 'ASC')
      .skip(skip)
      .take(limit);

    if (currentUser.role === UserRole.PATIENT) {
      qb.where('a.patientId = :id', { id: currentUser.id });
    } else if (currentUser.role === UserRole.DOCTOR) {
      qb.where('a.doctorId = :id', { id: currentUser.id });
    } else {
      if (patientId) qb.andWhere('a.patientId = :patientId', { patientId });
      if (doctorId) qb.andWhere('a.doctorId = :doctorId', { doctorId });
    }

    if (status) qb.andWhere('a.status = :status', { status });
    if (date) qb.andWhere('a.appointmentDate = :date', { date });

    const [appointments, total] = await qb.getManyAndCount();
    return {
      appointments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async create(dto: CreateAppointmentDto, patient: User): Promise<Appointment> {
    // Handle guest bookings vs logged-in users
    const isGuest = dto.isGuest || !patient;
    
    const appointment = this.appointmentsRepository.create({
      patientId: isGuest ? null : patient?.id,
      doctorId: null, // No doctor assigned yet - admin will assign later
      patientName: dto.name || patient?.name || 'Guest',
      doctorName: null, // Will be set when admin assigns doctor
      patientEmail: dto.email || patient?.email,
      patientPhone: dto.phone || patient?.phone,
      appointmentDate: dto.appointmentDate,
      appointmentTime: dto.appointmentTime,
      reason: dto.reason,
      visitType: dto.visitType || 'Physical Visit',
      specialty: dto.specialty,
      location: dto.location,
      additionalComment: dto.comment,
      isUrgent: dto.isUrgent || false,
      fee: 0, // Will be set when doctor is assigned
      status: AppointmentStatus.PENDING,
      isConflicted: false,
    });

    const saved = await this.appointmentsRepository.save(appointment);

    // No chat conversation created until doctor is assigned
    // Admin/Appointment Officer will assign doctor and create conversation

    return saved;
  }

  async update(id: string, dto: UpdateAppointmentDto, currentUser: User): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (dto.status) {
      this.validateStatusTransition(appointment, dto.status, currentUser);
    }

    Object.assign(appointment, dto);
    const saved = await this.appointmentsRepository.save(appointment);

    if (dto.status) {
      await this.handleStatusChangeNotifications(saved, dto.status, currentUser);
    }

    return saved;
  }

  private validateStatusTransition(
    appointment: Appointment,
    newStatus: AppointmentStatus,
    user: User,
  ) {
    if (user.role === UserRole.ADMIN) return;

    const { status, patientId, doctorId } = appointment;

    if (user.role === UserRole.DOCTOR && user.id !== doctorId) {
      throw new ForbiddenException('Not your appointment');
    }
    if (user.role === UserRole.PATIENT && user.id !== patientId) {
      throw new ForbiddenException('Not your appointment');
    }

    const doctorTransitions: Record<string, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.REJECTED],
      [AppointmentStatus.CONFIRMED]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
    };
    const patientTransitions: Record<string, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.CANCELLED],
      [AppointmentStatus.CONFIRMED]: [AppointmentStatus.CANCELLED],
    };

    const allowed =
      user.role === UserRole.DOCTOR
        ? doctorTransitions[status] || []
        : patientTransitions[status] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${status} to ${newStatus}`);
    }
  }

  private async handleStatusChangeNotifications(
    appointment: Appointment,
    newStatus: AppointmentStatus,
    actor: User,
  ) {
    const recipientId =
      actor.role === UserRole.DOCTOR ? appointment.patientId : appointment.doctorId;

    // No notification for status changes - appointments visible in dashboard
    // Real-time update via WebSocket only
    this.chatGateway.emitAppointmentUpdate(recipientId, appointment);

    if (newStatus === AppointmentStatus.CONFIRMED) {
      try {
        const patientUser = await this.usersService.findById(appointment.patientId);
        await this.emailService.sendAppointmentConfirmed({ ...appointment, patient: patientUser });
      } catch (e) {}
    }

    // Keep prescription notification - medical importance
    if (newStatus === AppointmentStatus.COMPLETED && appointment.prescriptions?.length > 0) {
      const patientNotif = await this.notificationsService.create({
        userId: appointment.patientId,
        type: NotificationType.NEW_PRESCRIPTION,
        title: 'New Prescription',
        message: `${appointment.doctorName} has added a prescription for you.`,
        actionUrl: `/app/patient/prescriptions`,
        metadata: { appointmentId: appointment.id },
      });
      this.chatGateway.emitNotification(appointment.patientId, patientNotif);
    }
  }

  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    currentUser: User,
  ): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.id !== appointment.patientId &&
      currentUser.id !== appointment.doctorId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const availability = await this.availabilityRepository.findOne({
      where: { doctorId: appointment.doctorId },
    });

    if (availability) {
      const isBooked = availability.bookedSlots?.some(
        (s) =>
          s.date === dto.appointmentDate &&
          s.time === dto.appointmentTime &&
          s.appointmentId !== id,
      );
      if (isBooked) throw new BadRequestException('New time slot is already booked');

      const isUnavailable = availability.unavailableSlots?.some(
        (s) => s.date === dto.appointmentDate && s.time === dto.appointmentTime,
      );
      if (isUnavailable) throw new BadRequestException('New time slot is unavailable');

      const idx = availability.bookedSlots?.findIndex((s) => s.appointmentId === id);
      if (idx >= 0) {
        availability.bookedSlots[idx] = {
          date: dto.appointmentDate,
          time: dto.appointmentTime,
          appointmentId: id,
        };
        await this.availabilityRepository.save(availability);
      }
    }

    appointment.appointmentDate = dto.appointmentDate;
    appointment.appointmentTime = dto.appointmentTime;
    appointment.status = AppointmentStatus.RESCHEDULED;
    appointment.isConflicted = false;

    const saved = await this.appointmentsRepository.save(appointment);

    const otherUserId =
      currentUser.id === appointment.patientId ? appointment.doctorId : appointment.patientId;

    // No notification for reschedule - appointments visible in dashboard
    // Real-time update via WebSocket only
    this.chatGateway.emitAppointmentUpdate(otherUserId, saved);

    return saved;
  }

  /**
   * Update lock fields in appointment entity
   * Used by appointment locking system
   */
  async updateLockFields(
    appointmentId: string,
    lockedBy: string | null,
    lockedAt: Date | null,
  ): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);
    appointment.lockedBy = lockedBy;
    appointment.lockedAt = lockedAt;
    return this.appointmentsRepository.save(appointment);
  }

  /**
   * Auto-unlock appointment when status changes to final states
   */
  private async autoUnlockIfFinalStatus(status: AppointmentStatus, appointmentId: string) {
    const finalStatuses = [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.REJECTED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ];

    if (finalStatuses.includes(status)) {
      await this.updateLockFields(appointmentId, null, null);
    }
  }
}
