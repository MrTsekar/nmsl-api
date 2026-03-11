import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/entities/user.entity';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { UsersService } from '../../users/services/users.service';
import { DoctorsService } from '../../doctors/services/doctors.service';
import { EmailService } from '../../notifications/services/email.service';
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns';

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
  ) {}

  async getKpis() {
    const now = new Date();

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      appointmentsThisMonth,
      pendingAppointments,
      completedToday,
    ] = await Promise.all([
      this.usersRepository.count({ where: { role: UserRole.PATIENT } }),
      this.usersRepository.count({ where: { role: UserRole.DOCTOR } }),
      this.appointmentsRepository.count(),
      this.appointmentsRepository.count({
        where: {
          createdAt: Between(startOfMonth(now), endOfMonth(now)),
        },
      }),
      this.appointmentsRepository.count({
        where: { status: AppointmentStatus.PENDING },
      }),
      this.appointmentsRepository.count({
        where: {
          status: AppointmentStatus.COMPLETED,
          updatedAt: Between(startOfDay(now), endOfDay(now)),
        },
      }),
    ]);

    const totalRevenue = await this.appointmentsRepository
      .createQueryBuilder('a')
      .select('SUM(a.fee)', 'total')
      .where('a.status = :status', { status: AppointmentStatus.COMPLETED })
      .getRawOne();

    const monthlyRevenue = await this.appointmentsRepository
      .createQueryBuilder('a')
      .select('SUM(a.fee)', 'total')
      .where('a.status = :status', { status: AppointmentStatus.COMPLETED })
      .andWhere('a.updatedAt BETWEEN :start AND :end', {
        start: startOfMonth(now),
        end: endOfMonth(now),
      })
      .getRawOne();

    return {
      totalPatients,
      totalDoctors,
      totalAppointments,
      appointmentsThisMonth,
      pendingAppointments,
      completedToday,
      revenue: {
        total: parseFloat(totalRevenue?.total) || 0,
        thisMonth: parseFloat(monthlyRevenue?.total) || 0,
      },
    };
  }

  async createDoctor(dto: CreateDoctorDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const doctor = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.DOCTOR,
    });

    await this.doctorsService.createDefaultAvailability(doctor.id);

    try {
      await this.emailService.sendWelcomeEmail(doctor);
    } catch (e) {}

    return doctor;
  }

  async getDoctors(query: {
    specialty?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    return this.usersService.findDoctors(query);
  }

  async toggleUserStatus(id: string) {
    const user = await this.usersService.toggleStatus(id);
    return {
      id: user.id,
      name: user.name,
      isActive: user.isActive,
      message: user.isActive ? 'User activated successfully' : 'User deactivated successfully',
    };
  }
}
