import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateServiceLocationEnum1775910956835 implements MigrationInterface {
    name = 'UpdateServiceLocationEnum1775910956835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, ensure column is VARCHAR (it might already be)
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "location" TYPE VARCHAR`);
        
        // Create the enum type
        await queryRunner.query(`CREATE TYPE "public"."services_location_enum" AS ENUM('Abuja', 'Lagos', 'Benin', 'Kaduna', 'Port Harcourt', 'Warri')`);
        
        // Convert column to enum type, preserving existing data
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "location" TYPE "public"."services_location_enum" USING location::text::"public"."services_location_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "location" TYPE VARCHAR`);
        await queryRunner.query(`DROP TYPE "public"."services_location_enum"`);
    }

}
