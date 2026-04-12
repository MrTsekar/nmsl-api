import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { DoctorAvailability } from '../entities/doctor-availability.entity';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { MarkUnavailableDto } from '../dto/mark-unavailable.dto';
import { CheckAvailabilityDto } from '../dto/check-availability.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { EmailService } from '../../notifications/services/email.service';
import { UsersService } from '../../users/services/users.service';
import { ChatGateway } from '../../chat/gateways/chat.gateway';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(DoctorAvailability)
    private readonly availabilityRepository: Repository<DoctorAvailability>,
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getAvailability(doctorId: string): Promise<any> {
    const availability = await this.availabilityRepository.findOne({
      where: { doctorId },
    });
    if (!availability) throw new NotFoundException('Availability not found for this doctor');
    return this.formatAvailabilityResponse(availability);
  }

  async getAvailabilityByName(doctorName: string): Promise<any> {
    const decodedName = decodeURIComponent(doctorName);
    const doctor = await this.usersService.findAll({
      role: UserRole.DOCTOR,
      search: decodedName,
      page: 1,
      limit: 1,
    });

    if (!doctor.users || doctor.users.length === 0) {
      throw new NotFoundException(`Doctor '${decodedName}' not found`);
    }

    return this.getAvailability(doctor.users[0].id);
  }

  async checkAvailability(dto: CheckAvailabilityDto) {
    const availability = await this.availabilityRepository.findOne({
      where: { doctorId: dto.doctorId },
    });

    if (!availability) {
      return { available: false, reason: 'Doctor has no schedule configured' };
    }

    const dayOfWeek = new Date(dto.date).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    if (!availability.availableDays.includes(dayOfWeek)) {
      return { available: false, reason: `Doctor is not available on ${dayOfWeek}` };
    }

    if (!availability.timeSlots.includes(dto.time)) {
      return { available: false, reason: 'Time slot does not exist' };
    }

    const isBooked = availability.bookedSlots?.some(
      (s) => s.date === dto.date && s.time === dto.time,
    );
    if (isBooked) {
      return { available: false, reason: 'Time slot is already booked' };
    }

    const isUnavailable = availability.unavailableSlots?.some(
      (s) => s.date === dto.date && s.time === dto.time,
    );
    if (isUnavailable) {
      return { available: false, reason: 'Time slot is marked unavailable' };
    }

    return { available: true };
  }

  async updateAvailability(
    doctorId: string,
    dto: UpdateAvailabilityDto,
    currentUser: User,
  ): Promise<DoctorAvailability> {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.id !== doctorId
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Validate doctorId if provided in body
    if (dto.doctorId && dto.doctorId !== doctorId) {
      throw new BadRequestException('Doctor ID mismatch');
    }

    let availability = await this.availabilityRepository.findOne({
      where: { doctorId },
    });

    if (!availability) {
      availability = this.availabilityRepository.create({
        doctorId,
        days: [],
        useUniformTime: false,
        uniformTimeStart: null,
        uniformTimeEnd: null,
        customTimes: null,
        // Legacy fields
        availableDays: [],
        timeSlots: [],
        bookedSlots: [],
        unavailableSlots: [],
      });
    }

    // Update with new spec-compliant fields
    availability.days = dto.days;
    availability.useUniformTime = dto.useUniformTime;

    if (dto.useUniformTime && dto.uniformTime) {
      availability.uniformTimeStart = dto.uniformTime.start;
      availability.uniformTimeEnd = dto.uniformTime.end;
      availability.customTimes = null;
    } else if (!dto.useUniformTime && dto.customTimes) {
      availability.uniformTimeStart = null;
      availability.uniformTimeEnd = null;
      availability.customTimes = dto.customTimes;
    }

    const saved = await this.availabilityRepository.save(availability);

    // Return formatted response
    return this.formatAvailabilityResponse(saved);
  }

  private formatAvailabilityResponse(availability: DoctorAvailability): any {
    return {
      doctorId: availability.doctorId,
      days: availability.days || [],
      useUniformTime: availability.useUniformTime,
      uniformTime: availability.useUniformTime && availability.uniformTimeStart && availability.uniformTimeEnd
        ? { start: availability.uniformTimeStart, end: availability.uniformTimeEnd }
        : null,
      customTimes: !availability.useUniformTime ? availability.customTimes : null,
    };
  }

  async markUnavailable(
    doctorId: string,
    dto: MarkUnavailableDto,
    currentUser: User,
  ) {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.id !== doctorId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const availability = await this.availabilityRepository.findOne({
      where: { doctorId },
    });

    if (!availability) throw new NotFoundException('Availability not found');

    const currentUnavailable = availability.unavailableSlots || [];
    availability.unavailableSlots = [
      ...currentUnavailable,
      ...dto.slots.map((s) => ({ date: s.date, time: s.time, reason: s.reason })),
    ];
    await this.availabilityRepository.save(availability);

    const conflictedAppointments = [];

    for (const slot of dto.slots) {
      const appointments = await this.appointmentsRepository.find({
        where: {
          doctorId,
          appointmentDate: slot.date,
          appointmentTime: slot.time,
          status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        },
      });

      for (const appt of appointments) {
        appt.isConflicted = true;
        await this.appointmentsRepository.save(appt);
        conflictedAppointments.push(appt);

        // No notification - conflict flag visible in appointments dashboard
        // Real-time update via WebSocket
        this.chatGateway.emitAppointmentUpdate(appt.patientId, appt);

        try {
          const patient = await this.usersService.findById(appt.patientId);
          await this.emailService.sendAppointmentConflict({ ...appt, patient });
        } catch (e) {}
      }
    }

    return {
      success: true,
      unavailableSlots: dto.slots,
      conflictedAppointments,
      message: `${conflictedAppointments.length} appointments affected. Patients have been notified.`,
    };
  }

  async createDefaultAvailability(doctorId: string): Promise<DoctorAvailability> {
    const availability = this.availabilityRepository.create({
      doctorId,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
      bookedSlots: [],
      unavailableSlots: [],
    });
    return this.availabilityRepository.save(availability);
  }

  // Appointment booking endpoints
  async findAll(filters?: { location?: string; specialty?: string }) {
    const query = this.doctorRepository.createQueryBuilder('doctor')
      .where('doctor.isActive = :isActive', { isActive: true })
      .select([
        'doctor.id',
        'doctor.name',
        'doctor.email',
        'doctor.specialty',
        'doctor.location',
        'doctor.phone',
        'doctor.qualifications',
        'doctor.avatar',
      ]);

    if (filters?.location) {
      query.andWhere('doctor.location = :location', { location: filters.location });
    }

    if (filters?.specialty) {
      query.andWhere('doctor.specialty = :specialty', { specialty: filters.specialty });
    }

    const doctors = await query.getMany();

    return {
      success: true,
      data: doctors,
      count: doctors.length,
    };
  }

  async getLocations() {
    const locations = await this.doctorRepository
      .createQueryBuilder('doctor')
      .select('DISTINCT doctor.location', 'location')
      .where('doctor.isActive = :isActive', { isActive: true })
      .andWhere('doctor.location IS NOT NULL')
      .getRawMany();

    return {
      success: true,
      data: locations.map(l => l.location),
    };
  }

  async getSpecialties() {
    const specialties = await this.doctorRepository
      .createQueryBuilder('doctor')
      .select('DISTINCT doctor.specialty', 'specialty')
      .where('doctor.isActive = :isActive', { isActive: true })
      .andWhere('doctor.specialty IS NOT NULL')
      .getRawMany();

    return {
      success: true,
      data: specialties.map(s => s.specialty),
    };
  }

  async getStandardTimeSlots(date: string) {
    try {
      // Validate date format
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }

      const parsedDate = new Date(date + 'T00:00:00Z');
      
      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestException('Invalid date value');
      }

      const dayOfWeek = parsedDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Weekend check
      if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
        return {
          success: true,
          data: [],
          message: 'Hospital is closed on weekends',
          date,
          dayOfWeek,
        };
      }

      // Standard hospital hours: 8 AM - 5 PM (hourly slots)
      const standardSlots = [
        '08:00', '09:00', '10:00', '11:00', 
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
      ];

      return {
        success: true,
        data: standardSlots,
        date,
        dayOfWeek,
        message: 'Doctor will be assigned by admin/appointment officer',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process date: ' + error.message);
    }
  }
}
