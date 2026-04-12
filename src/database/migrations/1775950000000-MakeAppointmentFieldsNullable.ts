import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeAppointmentFieldsNullable1775950000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make patientId, doctorId, and doctorName nullable to support guest bookings
    await queryRunner.query(
      `ALTER TABLE "appointment" ALTER COLUMN "patientId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ALTER COLUMN "doctorId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ALTER COLUMN "doctorName" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the changes
    await queryRunner.query(
      `ALTER TABLE "appointment" ALTER COLUMN "doctorName" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ALTER COLUMN "doctorId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment" ALTER COLUMN "patientId" SET NOT NULL`,
    );
  }
}
