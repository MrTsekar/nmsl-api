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

  // Send appointment confirmation to patient when officer accepts booking
  async sendAppointmentAcceptedToPatient(appointment: any) {
    await this.send({
      to: appointment.patientEmail,
      from: this.from,
      subject: `Appointment Confirmed - ${appointment.doctorName}`,
      html: `
        <h1>🎉 Your Appointment is Confirmed!</h1>
        <p>Dear ${appointment.patientName},</p>
        <p>Great news! Your appointment request has been confirmed.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Appointment Details</h2>
          <p><strong>Doctor:</strong> ${appointment.doctorName}</p>
          <p><strong>Specialty:</strong> ${appointment.specialty}</p>
          <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
          <p><strong>Location:</strong> ${appointment.location}</p>
          <p><strong>Consultation Fee:</strong> ₦${appointment.fee}</p>
        </div>
        
        <p><strong>Important:</strong> Please arrive 10-15 minutes early for check-in.</p>
        <p><a href="${this.frontendUrl}/app/appointments/${appointment.id}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Appointment</a></p>
        
        <p style="margin-top: 30px; color: #666;">If you need to reschedule, please do so at least 24 hours in advance.</p>
        <p>Best regards,<br><strong>NMSL Healthcare Team</strong></p>
      `,
    });
  }

  // Send appointment confirmation to doctor when officer accepts booking
  async sendAppointmentAcceptedToDoctor(appointment: any, doctorEmail: string) {
    await this.send({
      to: doctorEmail,
      from: this.from,
      subject: `New Appointment - ${appointment.patientName}`,
      html: `
        <h1>New Patient Appointment</h1>
        <p>Dear Dr. ${appointment.doctorName},</p>
        <p>A new appointment has been scheduled with you.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Appointment Details</h2>
          <p><strong>Patient:</strong> ${appointment.patientName}</p>
          <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
          <p><strong>Location:</strong> ${appointment.location}</p>
          <p><strong>Reason for Visit:</strong> ${appointment.reason}</p>
          ${appointment.patientEmail ? `<p><strong>Patient Email:</strong> ${appointment.patientEmail}</p>` : ''}
        </div>
        
        <p><a href="${this.frontendUrl}/app/doctor/appointments/${appointment.id}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Details</a></p>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>NMSL Healthcare System</strong></p>
      `,
    });
  }

  // Send appointment rejection to patient
  async sendAppointmentRejectedToPatient(appointment: any, reason?: string) {
    await this.send({
      to: appointment.patientEmail,
      from: this.from,
      subject: `Appointment Update - ${appointment.doctorName}`,
      html: `
        <h1>Appointment Status Update</h1>
        <p>Dear ${appointment.patientName},</p>
        <p>We regret to inform you that your appointment request could not be confirmed at this time.</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Original Appointment Details:</strong></p>
          <p>Doctor: ${appointment.doctorName}</p>
          <p>Date: ${new Date(appointment.appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Time: ${appointment.appointmentTime}</p>
          ${reason ? `<p style="margin-top: 15px;"><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        
        <p>We encourage you to:</p>
        <ul>
          <li>Select an alternative date/time</li>
          <li>Choose a different doctor with similar specialty</li>
          <li>Contact us for assistance: contact@nmsl.app</li>
        </ul>
        
        <p><a href="${this.frontendUrl}/app/appointments/book" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Book New Appointment</a></p>
        
        <p style="margin-top: 30px;">We apologize for any inconvenience.</p>
        <p>Best regards,<br><strong>NMSL Healthcare Team</strong></p>
      `,
    });
  }
}
