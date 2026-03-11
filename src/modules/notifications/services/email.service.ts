import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.from = this.configService.get<string>('EMAIL_FROM') || 'noreply@nmsla.com';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.enabled = !!apiKey && !apiKey.startsWith('your_');
    if (this.enabled) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn('SendGrid API key not configured. Emails will be logged only.');
    }
  }

  private async send(msg: any) {
    if (!this.enabled) {
      this.logger.log(`[EMAIL MOCK] To: ${msg.to} | Subject: ${msg.subject}`);
      return;
    }
    try {
      await sgMail.send(msg);
    } catch (e) {
      this.logger.error(`Failed to send email: ${e.message}`);
    }
  }

  async sendWelcomeEmail(user: any) {
    await this.send({
      to: user.email,
      from: this.from,
      subject: 'Welcome to NMSL Healthcare!',
      html: `
        <h1>Welcome ${user.name}!</h1>
        <p>Your account has been created successfully.</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <p>You can now log in at: <a href="${this.frontendUrl}/sign-in">Login</a></p>
        <p>Best regards,<br>NMSL Healthcare Team</p>
      `,
    });
  }

  async sendAppointmentConfirmed(appointment: any) {
    await this.send({
      to: appointment.patient?.email,
      from: this.from,
      subject: `Appointment Confirmed with ${appointment.doctorName}`,
      html: `
        <h1>Appointment Confirmed!</h1>
        <p>Hi ${appointment.patientName},</p>
        <p>Your appointment has been confirmed!</p>
        <ul>
          <li><strong>Doctor:</strong> ${appointment.doctorName}</li>
          <li><strong>Date:</strong> ${appointment.appointmentDate}</li>
          <li><strong>Time:</strong> ${appointment.appointmentTime}</li>
          <li><strong>Location:</strong> ${appointment.location}</li>
        </ul>
        <p>Please arrive 10 minutes early.</p>
        <p><a href="${this.frontendUrl}/app/appointments/${appointment.id}">View Details</a></p>
      `,
    });
  }

  async sendAppointmentConflict(appointment: any) {
    await this.send({
      to: appointment.patient?.email,
      from: this.from,
      subject: 'Action Required: Rebook Your Appointment',
      html: `
        <h1>Appointment Conflict</h1>
        <p>Hi ${appointment.patientName},</p>
        <p>Unfortunately, your appointment with ${appointment.doctorName} on ${appointment.appointmentDate} at ${appointment.appointmentTime} is no longer available due to doctor's unavailability.</p>
        <p>Please rebook your appointment as soon as possible.</p>
        <p><a href="${this.frontendUrl}/app/appointments">Rebook Now</a></p>
        <p>We apologize for the inconvenience.</p>
      `,
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await this.send({
      to: email,
      from: this.from,
      subject: 'Reset Your Password',
      html: `
        <h1>Reset Your Password</h1>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink}">Click here to reset</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendNewPrescription(appointment: any) {
    await this.send({
      to: appointment.patient?.email,
      from: this.from,
      subject: 'New Prescription Available',
      html: `
        <h1>New Prescription</h1>
        <p>Hi ${appointment.patientName},</p>
        <p>${appointment.doctorName} has added a prescription for you.</p>
        <p><a href="${this.frontendUrl}/app/patient/prescriptions">View Prescription</a></p>
      `,
    });
  }

  async sendResultUploaded(patient: any, testName: string) {
    await this.send({
      to: patient.email,
      from: this.from,
      subject: 'New Medical Result Available',
      html: `
        <h1>Medical Result Ready</h1>
        <p>Hi ${patient.name},</p>
        <p>Your ${testName} result is now available.</p>
        <p><a href="${this.frontendUrl}/app/patient/results">View Results</a></p>
      `,
    });
  }
}
