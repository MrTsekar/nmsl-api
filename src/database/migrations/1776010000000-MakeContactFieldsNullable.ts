import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeContactFieldsNullable1776010000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "phone" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "emailPrimary" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "addressLine1" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "addressLine2" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "city" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "country" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "officeHours" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "emergencyHours" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "emergencyHours" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "officeHours" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "country" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "city" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "addressLine2" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "addressLine1" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "emailPrimary" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact_info" ALTER COLUMN "phone" SET NOT NULL`,
    );
  }
}
