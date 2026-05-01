import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1775805662731 implements MigrationInterface {
    name = 'InitialSchema1775805662731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Try to enable UUID extension (may fail on Azure, that's OK if gen_random_uuid is available)
        try {
            await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        } catch (error) {
            console.log('⚠️  uuid-ossp extension not available, using gen_random_uuid() instead');
        }
        
        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM(
                'patient',
                'doctor',
                'admin',
                'appointment_officer'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_specialty_enum" AS ENUM(
                'General Practice',
                'Cardiology',
                'Dermatology',
                'Pediatrics',
                'Orthopedics',
                'Neurology',
                'Gynecology',
                'Psychiatry',
                'Ophthalmology',
                'Dentistry'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'patient',
                "phone" character varying NOT NULL,
                "location" character varying NOT NULL,
                "state" character varying NOT NULL,
                "address" character varying,
                "avatar" character varying,
                "specialty" "public"."users_specialty_enum",
                "qualifications" character varying,
                "yearsOfExperience" integer,
                "consultationFee" numeric(10, 2),
                "rating" numeric(3, 2) DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "gender" character varying,
                "emailVerified" boolean NOT NULL DEFAULT false,
                "resetPasswordToken" character varying,
                "resetPasswordExpires" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fde7e45af21a766d1d6d9756ef" ON "users" ("specialty")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
        `);
        await queryRunner.query(`
            CREATE TABLE "statistics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "icon" character varying NOT NULL,
                "value" character varying NOT NULL,
                "label" character varying NOT NULL,
                "description" character varying,
                CONSTRAINT "PK_c3769cca342381fa827a0f246a7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "partners" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "logo" character varying,
                "website" character varying,
                "order" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_998645b20820e4ab99aeae03b41" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum" AS ENUM(
                'appointment_confirmed',
                'appointment_rescheduled',
                'appointment_cancelled',
                'appointment_conflict',
                'new_message',
                'new_prescription',
                'new_result'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" "public"."notifications_type_enum" NOT NULL,
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "isRead" boolean NOT NULL DEFAULT false,
                "actionUrl" character varying,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_831a5a06f879fb0bebf8965871" ON "notifications" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8ba28344602d583583b9ea1a50" ON "notifications" ("isRead")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId")
        `);
        await queryRunner.query(`
            CREATE TABLE "doctor_availability" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "doctorId" uuid,
                "days" text,
                "useUniformTime" boolean NOT NULL DEFAULT false,
                "uniformTimeStart" TIME,
                "uniformTimeEnd" TIME,
                "customTimes" jsonb,
                "availableDays" text,
                "timeSlots" text,
                "bookedSlots" jsonb DEFAULT '[]',
                "unavailableSlots" jsonb DEFAULT '[]',
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "REL_7ebf8396e8918307342d6bcf82" UNIQUE ("doctorId"),
                CONSTRAINT "PK_3d2b4ffe9085f8c7f9f269aed89" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."doctors_specialty_enum" AS ENUM(
                'General Practice',
                'Gynecology',
                'Physiotherapy',
                'Pediatrics',
                'Cardiology',
                'Dermatology',
                'Orthopedics',
                'Psychiatry',
                'Radiology',
                'Surgery'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "doctors" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "specialty" "public"."doctors_specialty_enum" NOT NULL,
                "location" character varying NOT NULL,
                "state" character varying,
                "phone" character varying,
                "qualifications" text,
                "avatar" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_62069f52ebba471c91de5d59d61" UNIQUE ("email"),
                CONSTRAINT "PK_8207e7889b50ee3695c2b8154ff" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c63fe7c2f3a974d0aa55ebdba4" ON "doctors" ("location")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_738d9334429a42933b01e969a9" ON "doctors" ("specialty")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_62069f52ebba471c91de5d59d6" ON "doctors" ("email")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."services_category_enum" AS ENUM(
                'Emergency Services',
                'Specialized Care',
                'Dental Care',
                'Primary Care',
                'Surgical Services',
                'Diagnostic Services',
                'Women''s Health',
                'Pediatric Care',
                'Mental Health',
                'Rehabilitation'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "services" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "category" "public"."services_category_enum" NOT NULL,
                "location" character varying NOT NULL,
                "shortDescription" text NOT NULL,
                "fullDescription" text NOT NULL,
                "bannerImageUrl" character varying,
                "iconImageUrl" character varying,
                "keyServices" jsonb NOT NULL DEFAULT '[]',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "chat_conversations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "appointmentId" character varying NOT NULL,
                "patientId" uuid NOT NULL,
                "doctorId" uuid NOT NULL,
                "patientName" character varying NOT NULL,
                "doctorName" character varying NOT NULL,
                "lastMessage" character varying,
                "lastMessageTime" TIMESTAMP,
                "unreadCount" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_44141b19d040bb3b84548e01047" UNIQUE ("appointmentId"),
                CONSTRAINT "PK_ff117d9f57807c4f2e3034a39f3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "conversationId" uuid NOT NULL,
                "senderId" uuid NOT NULL,
                "senderName" character varying NOT NULL,
                "senderRole" character varying NOT NULL,
                "content" text NOT NULL,
                "timestamp" TIMESTAMP NOT NULL,
                "isRead" boolean NOT NULL DEFAULT false,
                "attachments" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."appointments_status_enum" AS ENUM(
                'pending',
                'scheduled',
                'confirmed',
                'rescheduled',
                'rejected',
                'completed',
                'no-show',
                'cancelled'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "appointments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "patientId" uuid NOT NULL,
                "doctorId" uuid NOT NULL,
                "patientName" character varying NOT NULL,
                "doctorName" character varying NOT NULL,
                "appointmentDate" date NOT NULL,
                "appointmentTime" character varying NOT NULL,
                "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'pending',
                "reason" text NOT NULL,
                "notes" text,
                "prescriptions" jsonb,
                "specialty" character varying NOT NULL,
                "location" character varying NOT NULL,
                "fee" numeric(10, 2) NOT NULL,
                "isConflicted" boolean NOT NULL DEFAULT false,
                "visitType" character varying,
                "rescheduleReason" text,
                "patientEmail" character varying,
                "patientPhone" character varying,
                "isUrgent" boolean NOT NULL DEFAULT false,
                "additionalComment" text,
                "lockedBy" character varying,
                "lockedAt" TIMESTAMP,
                "originalAppointmentId" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8f1c97eedcf4831a392b9a479c" ON "appointments" ("doctorId", "appointmentDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_621fe00c75467aa463264d938b" ON "appointments" ("lockedAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_c82ff2a94d33519adaf4754248" ON "appointments" ("lockedBy")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3012094cd78bdbf03e787605a9" ON "appointments" ("isConflicted")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_3007a47d97a542e63b3308a69b" ON "appointments" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e8113a984f6ce98fc4a8f7f4e3" ON "appointments" ("appointmentDate")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0c1af27b469cb8dca420c160d6" ON "appointments" ("doctorId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_13c2e57cb81b44f062ba24df57" ON "appointments" ("patientId")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."medical_results_status_enum" AS ENUM('pending', 'completed')
        `);
        await queryRunner.query(`
            CREATE TABLE "medical_results" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "patientId" uuid NOT NULL,
                "appointmentId" uuid NOT NULL,
                "testName" character varying NOT NULL,
                "testDate" date NOT NULL,
                "resultDate" date NOT NULL,
                "labName" character varying NOT NULL,
                "status" "public"."medical_results_status_enum" NOT NULL DEFAULT 'pending',
                "fileUrl" character varying NOT NULL,
                "fileType" character varying NOT NULL,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3bfced2efaab3e9187bf96929e0" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "contact_info" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "phone" character varying NOT NULL,
                "emailPrimary" character varying NOT NULL,
                "emailSecondary" character varying,
                "addressLine1" character varying NOT NULL,
                "addressLine2" character varying NOT NULL,
                "city" character varying NOT NULL,
                "country" character varying NOT NULL,
                "officeHours" character varying NOT NULL,
                "emergencyHours" character varying NOT NULL,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_65b98fa4ffb26dceb9192f5d496" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "board_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "title" character varying NOT NULL,
                "bio" text,
                "image" character varying,
                "order" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6994cea1393b5fa3a0dd827a9f7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."audit_logs_action_enum" AS ENUM(
                'accepted',
                'rejected',
                'rescheduled',
                'completed',
                'admin_override'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "appointmentId" character varying NOT NULL,
                "patientName" character varying NOT NULL,
                "action" "public"."audit_logs_action_enum" NOT NULL,
                "performedBy" character varying NOT NULL,
                "performedByName" character varying NOT NULL,
                "performedAt" TIMESTAMP NOT NULL,
                "details" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ccafd2d064086b79c0fc790562" ON "audit_logs" ("appointmentId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_57680dda80b2d5c8967f2b50af" ON "audit_logs" ("performedAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a8bd8d95914d6228770fe87b8a" ON "audit_logs" ("performedBy")
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_availability"
            ADD CONSTRAINT "FK_7ebf8396e8918307342d6bcf82b" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_conversations"
            ADD CONSTRAINT "FK_41fe346dd4b94ab64092c8aa47f" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_conversations"
            ADD CONSTRAINT "FK_a231172e2610f0fe496302dfdca" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_13c2e57cb81b44f062ba24df57d" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_0c1af27b469cb8dca420c160d65" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medical_results"
            ADD CONSTRAINT "FK_c02a865833f09ccae7ac96201b6" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medical_results"
            ADD CONSTRAINT "FK_000f39703ceeee5726026ae3e12" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "medical_results" DROP CONSTRAINT "FK_000f39703ceeee5726026ae3e12"
        `);
        await queryRunner.query(`
            ALTER TABLE "medical_results" DROP CONSTRAINT "FK_c02a865833f09ccae7ac96201b6"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_0c1af27b469cb8dca420c160d65"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_13c2e57cb81b44f062ba24df57d"
        `);
        await queryRunner.query(`
            ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"
        `);
        await queryRunner.query(`
            ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_conversations" DROP CONSTRAINT "FK_a231172e2610f0fe496302dfdca"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_conversations" DROP CONSTRAINT "FK_41fe346dd4b94ab64092c8aa47f"
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_availability" DROP CONSTRAINT "FK_7ebf8396e8918307342d6bcf82b"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a8bd8d95914d6228770fe87b8a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_57680dda80b2d5c8967f2b50af"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ccafd2d064086b79c0fc790562"
        `);
        await queryRunner.query(`
            DROP TABLE "audit_logs"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."audit_logs_action_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "board_members"
        `);
        await queryRunner.query(`
            DROP TABLE "contact_info"
        `);
        await queryRunner.query(`
            DROP TABLE "medical_results"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."medical_results_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_13c2e57cb81b44f062ba24df57"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0c1af27b469cb8dca420c160d6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e8113a984f6ce98fc4a8f7f4e3"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3007a47d97a542e63b3308a69b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3012094cd78bdbf03e787605a9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c82ff2a94d33519adaf4754248"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_621fe00c75467aa463264d938b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8f1c97eedcf4831a392b9a479c"
        `);
        await queryRunner.query(`
            DROP TABLE "appointments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."appointments_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "messages"
        `);
        await queryRunner.query(`
            DROP TABLE "chat_conversations"
        `);
        await queryRunner.query(`
            DROP TABLE "services"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."services_category_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_62069f52ebba471c91de5d59d6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_738d9334429a42933b01e969a9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_c63fe7c2f3a974d0aa55ebdba4"
        `);
        await queryRunner.query(`
            DROP TABLE "doctors"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."doctors_specialty_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "doctor_availability"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_692a909ee0fa9383e7859f9b40"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8ba28344602d583583b9ea1a50"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_831a5a06f879fb0bebf8965871"
        `);
        await queryRunner.query(`
            DROP TABLE "notifications"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."notifications_type_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "partners"
        `);
        await queryRunner.query(`
            DROP TABLE "statistics"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fde7e45af21a766d1d6d9756ef"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_specialty_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `);
    }

}
