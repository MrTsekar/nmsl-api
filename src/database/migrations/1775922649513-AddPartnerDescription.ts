import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartnerDescription1775922649513 implements MigrationInterface {
    name = 'AddPartnerDescription1775922649513'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partners" ADD "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "description"`);
    }

}
