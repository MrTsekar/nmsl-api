import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { NigeriaLocation } from '../../services/entities/service.entity';

@Injectable()
export class AppointmentAvailabilityService {
  // Working hours configuration
  private readonly WORKING_HOURS_START = 8; // 8:00 AM
  private readonly WORKING_HOURS_END = 17; // 5:00 PM (17:00)
  private readonly SLOT_DURATION_HOURS = 1; // 1-hour slots
  private readonly MAX_DATE_RANGE_DAYS = 90; // Maximum days for date range queries

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctorsRepository: Repository<Doctor>,
  ) {}

  /**
   * Get available time slots for a specific date, location, and specialty
   */
  async getAvailableSlots(
    date: string,
    location: NigeriaLocation,
    specialty: string,
  ): Promise<string[]> {
    // Validate date
    this.validateDate(date);

    // Check if date is a weekend
    if (this.isWeekend(date)) {
      return [];
    }

    // Check if date is in the past
    if (this.isPastDate(date)) {
      return [];
    }

    // Find all active doctors for the given location and specialty
    const doctors = await this.getDoctorsByLocationAndSpecialty(
      location,
      specialty,
    );

    // If no doctors available, return empty array
    if (doctors.length === 0) {
      return [];
    }

    // Get all booked appointments for this date, location, and specialty
    const bookedAppointments = await this.getBookedAppointments(
      date,
      location,
      specialty,
    );

    // Generate all possible time slots
    const allSlots = this.generateTimeSlots();

    // Calculate availability for each slot
    const availableSlots = allSlots.filter((slot) => {
      const bookingsAtThisSlot = bookedAppointments.filter(
        (apt) => apt.appointmentTime === slot,
      ).length;

      // A slot is available if bookings < number of doctors
      // (each doctor can see one patient per time slot)
      return bookingsAtThisSlot < doctors.length;
    });

    return availableSlots;
  }

  /**
   * Check if a specific date has any available slots
   */
  async checkDateAvailability(
    date: string,
    location: NigeriaLocation,
    specialty: string,
  ): Promise<{ available: boolean; slots: number }> {
    const availableSlots = await this.getAvailableSlots(
      date,
      location,
      specialty,
    );

    return {
      available: availableSlots.length > 0,
      slots: availableSlots.length,
    };
  }

  /**
   * Get list of dates that have available slots within a date range
   */
  async getAvailableDates(
    startDate: string,
    endDate: string,
    location: NigeriaLocation,
    specialty: string,
  ): Promise<string[]> {
    // Validate dates
    this.validateDate(startDate);
    this.validateDate(endDate);

    // Check if end date is before start date
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check if date range exceeds maximum
    const daysDiff = this.getDaysBetweenDates(startDate, endDate);
    if (daysDiff > this.MAX_DATE_RANGE_DAYS) {
      throw new BadRequestException(
        `Date range cannot exceed ${this.MAX_DATE_RANGE_DAYS} days`,
      );
    }

    const availableDates: string[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Iterate through each date in the range
    while (currentDate <= endDateObj) {
      const dateStr = this.formatDate(currentDate);

      // Skip weekends and past dates
      if (!this.isWeekend(dateStr) && !this.isPastDate(dateStr)) {
        const { available } = await this.checkDateAvailability(
          dateStr,
          location,
          specialty,
        );

        if (available) {
          availableDates.push(dateStr);
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availableDates;
  }

  /**
   * Generate all possible time slots within working hours
   */
  private generateTimeSlots(): string[] {
    const slots: string[] = [];

    for (
      let hour = this.WORKING_HOURS_START;
      hour <= this.WORKING_HOURS_END;
      hour++
    ) {
      slots.push(this.formatTime(hour, 0));
    }

    return slots;
  }

  /**
   * Get all doctors for a specific location and specialty
   */
  private async getDoctorsByLocationAndSpecialty(
    location: NigeriaLocation,
    specialty: string,
  ): Promise<Doctor[]> {
    return this.doctorsRepository.find({
      where: {
        location: location.toString(),
        specialty,
        isActive: true,
      },
    });
  }

  /**
   * Get all booked appointments for a specific date, location, and specialty
   * Excludes cancelled appointments
   */
  private async getBookedAppointments(
    date: string,
    location: NigeriaLocation,
    specialty: string,
  ): Promise<Appointment[]> {
    return this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.appointmentDate = :date', { date })
      .andWhere('appointment.location = :location', {
        location: location.toString(),
      })
      .andWhere('appointment.specialty = :specialty', { specialty })
      .andWhere('appointment.status != :cancelledStatus', {
        cancelledStatus: AppointmentStatus.CANCELLED,
      })
      .getMany();
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private validateDate(date: string): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestException(
        'Invalid date format. Expected YYYY-MM-DD',
      );
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Invalid date');
    }
  }

  /**
   * Check if a date is in the past
   */
  private isPastDate(date: string): boolean {
    const dateObj = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dateObj < today;
  }

  /**
   * Check if a date falls on a weekend (Saturday or Sunday)
   */
  private isWeekend(date: string): boolean {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Format time as HH:MM (24-hour with leading zeros)
   */
  private formatTime(hour: number, minute: number): string {
    const hourStr = hour.toString().padStart(2, '0');
    const minuteStr = minute.toString().padStart(2, '0');
    return `${hourStr}:${minuteStr}`;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculate days between two dates
   */
  private getDaysBetweenDates(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
