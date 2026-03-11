import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private client: twilio.Twilio;
  private readonly from: string;
  private readonly enabled: boolean;
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {
    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.from = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '+1234567890';
    this.enabled = !!sid && !!token && !sid.startsWith('your_');

    if (this.enabled) {
      this.client = twilio(sid, token);
    } else {
      this.logger.warn('Twilio credentials not configured. SMS will be logged only.');
    }
  }

  async sendSms(to: string, message: string) {
    if (!this.enabled) {
      this.logger.log(`[SMS MOCK] To: ${to} | Message: ${message}`);
      return;
    }
    try {
      await this.client.messages.create({ body: message, from: this.from, to });
    } catch (e) {
      this.logger.error(`Failed to send SMS: ${e.message}`);
    }
  }

  async sendAppointmentConfirmed(appointment: any) {
    const message = `NMSL: Your appointment with ${appointment.doctorName} on ${appointment.appointmentDate} at ${appointment.appointmentTime} is confirmed.`;
    await this.sendSms(appointment.patient?.phone, message);
  }

  async sendAppointmentConflict(appointment: any) {
    const message = `NMSL: URGENT - Your appointment with ${appointment.doctorName} on ${appointment.appointmentDate} needs rebooking. Please visit our website.`;
    await this.sendSms(appointment.patient?.phone, message);
  }
}
