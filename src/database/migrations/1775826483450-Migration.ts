import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775826483450 implements MigrationInterface {
    name = 'Migration1775826483450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."testimonials_category_enum" AS ENUM('staff', 'dependent', 'patient')`);
        await queryRunner.query(`CREATE TYPE "public"."testimonials_servicetype_enum" AS ENUM('physical_appointment', 'telemedicine', 'laboratory', 'pharmacy')`);
        await queryRunner.query(`CREATE TABLE "testimonials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patientName" character varying, "category" "public"."testimonials_category_enum" NOT NULL DEFAULT 'patient', "title" character varying NOT NULL, "message" text NOT NULL, "serviceType" "public"."testimonials_servicetype_enum" NOT NULL DEFAULT 'physical_appointment', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_63b03c608bd258f115a0a4a1060" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "testimonials"`);
        await queryRunner.query(`DROP TYPE "public"."testimonials_servicetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."testimonials_category_enum"`);
    }

}
