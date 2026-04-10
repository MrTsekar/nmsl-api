import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';
import { Appointment } from '../entities/appointment.entity';

export interface LockInfo {
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
}

@Injectable()
export class AppointmentLockService {
  private readonly LOCK_TTL = 1800; // 30 minutes in seconds
  private readonly LOCK_PREFIX = 'appointment:lock:';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private auditService: AuditService,
  ) {}

  /**
   * Acquire lock on an appointment
   * @param appointmentId - ID of the appointment to lock
   * @param officerEmail - Email of the officer requesting the lock
   * @param isAdmin - Whether the requester is an admin
   * @param adminName - Name of the admin (for audit logging)
   * @returns true if lock acquired, throws ConflictException if already locked
   */
  async acquireLock(
    appointmentId: string,
    officerEmail: string,
    isAdmin: boolean = false,
    adminName?: string,
  ): Promise<LockInfo> {
    const lockKey = this.getLockKey(appointmentId);
    const existingLock = await this.getLock(appointmentId);

    // Check if already locked by someone else
    if (existingLock && existingLock.lockedBy !== officerEmail) {
      // Check if lock is stale (>30 minutes old)
      if (this.isLockStale(existingLock)) {
        // Auto-clear stale lock
        await this.releaseLock(appointmentId);
      } else if (!isAdmin) {
        // Non-admins cannot override active locks
        throw new ConflictException(
          `Appointment is already being processed by ${existingLock.lockedBy}`,
        );
      } else {
        // Admin override - log the action
        await this.logAdminOverride(
          appointmentId,
          officerEmail,
          adminName || officerEmail,
          existingLock.lockedBy,
        );
      }
    }

    // Set lock with TTL
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.LOCK_TTL * 1000);
    const lockInfo: LockInfo = {
      lockedBy: officerEmail,
      lockedAt: now,
      expiresAt,
    };

    await this.cacheManager.set(lockKey, JSON.stringify(lockInfo), this.LOCK_TTL * 1000);

    return lockInfo;
  }

  /**
   * Release lock on an appointment
   * @param appointmentId - ID of the appointment to unlock
   */
  async releaseLock(appointmentId: string): Promise<void> {
    const lockKey = this.getLockKey(appointmentId);
    await this.cacheManager.del(lockKey);
  }

  /**
   * Get current lock info for an appointment
   * @param appointmentId - ID of the appointment
   * @returns Lock info if locked, null otherwise
   */
  async getLock(appointmentId: string): Promise<LockInfo | null> {
    const lockKey = this.getLockKey(appointmentId);
    const lockData = await this.cacheManager.get<string>(lockKey);

    if (!lockData) {
      return null;
    }

    try {
      const lockInfo = JSON.parse(lockData);
      return {
        ...lockInfo,
        lockedAt: new Date(lockInfo.lockedAt),
        expiresAt: new Date(lockInfo.expiresAt),
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if appointment is currently locked
   * @param appointmentId - ID of the appointment
   * @returns true if locked, false otherwise
   */
  async isLocked(appointmentId: string): Promise<boolean> {
    const lock = await this.getLock(appointmentId);
    if (!lock) return false;

    // Check if lock is stale
    if (this.isLockStale(lock)) {
      await this.releaseLock(appointmentId);
      return false;
    }

    return true;
  }

  /**
   * Check if lock is stale (older than LOCK_TTL)
   * @param lockInfo - Lock information
   * @returns true if lock is stale
   */
  private isLockStale(lockInfo: LockInfo): boolean {
    const now = new Date();
    return now > lockInfo.expiresAt;
  }

  /**
   * Get Redis key for appointment lock
   * @param appointmentId - ID of the appointment
   * @returns Redis key
   */
  private getLockKey(appointmentId: string): string {
    return `${this.LOCK_PREFIX}${appointmentId}`;
  }

  /**
   * Get remaining time in seconds for a lock
   * @param appointmentId - ID of the appointment
   * @returns Remaining time in seconds, 0 if not locked
   */
  async getRemainingTime(appointmentId: string): Promise<number> {
    const lock = await this.getLock(appointmentId);
    if (!lock) return 0;

    const now = new Date();
    const remaining = Math.max(
      0,
      Math.floor((lock.expiresAt.getTime() - now.getTime()) / 1000),
    );

    return remaining;
  }

  /**
   * Verify that a user has permission to unlock an appointment
   * @param appointmentId - ID of the appointment
   * @param officerEmail - Email of the officer requesting unlock
   * @param isAdmin - Whether the requester is an admin
   * @returns true if permitted, false otherwise
   */
  async canUnlock(
    appointmentId: string,
    officerEmail: string,
    isAdmin: boolean = false,
  ): Promise<boolean> {
    const lock = await this.getLock(appointmentId);

    if (!lock) {
      return true; // No lock exists
    }

    // Admins can unlock anything
    if (isAdmin) {
      return true;
    }

    // Officers can only unlock their own appointments
    return lock.lockedBy === officerEmail;
  }

  /**
   * Extend lock duration (refresh TTL)
   * @param appointmentId - ID of the appointment
   * @param officerEmail - Email of the officer who owns the lock
   */
  async extendLock(
    appointmentId: string,
    officerEmail: string,
  ): Promise<LockInfo> {
    const lock = await this.getLock(appointmentId);

    if (!lock || lock.lockedBy !== officerEmail) {
      throw new ConflictException('Lock does not exist or is owned by another officer');
    }

    // Refresh the lock
    return this.acquireLock(appointmentId, officerEmail, false);
  }

  /**
   * Log admin override action to audit trail
   * @param appointmentId - ID of the appointment
   * @param adminEmail - Email of the admin performing the override
   * @param adminName - Name of the admin
   * @param previousOfficer - Email of the officer whose lock was overridden
   */
  private async logAdminOverride(
    appointmentId: string,
    adminEmail: string,
    adminName: string,
    previousOfficer: string,
  ): Promise<void> {
    try {
      // Fetch appointment details
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
      });

      if (!appointment) {
        return; // Appointment not found, skip logging
      }

      // Create audit log entry
      await this.auditService.createAuditLog({
        appointmentId,
        patientName: appointment.patientName,
        action: AuditAction.ADMIN_OVERRIDE,
        performedBy: adminEmail,
        performedByName: adminName,
        details: `Admin ${adminName} (${adminEmail}) overrode lock held by ${previousOfficer}`,
      });
    } catch (error) {
      // Log error but don't fail the lock acquisition
      console.error('Failed to create admin override audit log:', error);
    }
  }
}

