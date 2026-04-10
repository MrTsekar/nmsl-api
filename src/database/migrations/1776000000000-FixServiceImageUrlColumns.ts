import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixServiceImageUrlColumns1776000000000 implements MigrationInterface {
  name = 'FixServiceImageUrlColumns1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change bannerImageUrl and iconImageUrl from varchar to text to support base64 images
    await queryRunner.query(`
      ALTER TABLE "services" 
      ALTER COLUMN "bannerImageUrl" TYPE text
    `);
    
    await queryRunner.query(`
      ALTER TABLE "services" 
      ALTER COLUMN "iconImageUrl" TYPE text
    `);

    // Make fullDescription nullable
    await queryRunner.query(`
      ALTER TABLE "services" 
      ALTER COLUMN "fullDescription" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert fullDescription to NOT NULL
    await queryRunner.query(`
      ALTER TABLE "services" 
      ALTER COLUMN "fullDescription" SET NOT NULL
    `);

    // Revert to varchar (may truncate data!)
    await queryRunner.query(`
      ALTER TABLE "services" 
      ALTER COLUMN "iconImageUrl" TYPE character varying
    `);
    
    await queryRunner.query(`
      ALTER TABLE "services" 
      ALTER COLUMN "bannerImageUrl" TYPE character varying
    `);
  }
}
