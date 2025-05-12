/*
  Warnings:

  - You are about to drop the `exam_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam_schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TashihRequestStatus" AS ENUM ('MENUNGGU', 'DITERIMA', 'DITOLAK', 'SELESAI');

-- DropForeignKey
ALTER TABLE "exam_requests" DROP CONSTRAINT "exam_requests_juzId_fkey";

-- DropForeignKey
ALTER TABLE "exam_requests" DROP CONSTRAINT "exam_requests_studentId_fkey";

-- DropForeignKey
ALTER TABLE "exam_requests" DROP CONSTRAINT "exam_requests_surahId_fkey";

-- DropForeignKey
ALTER TABLE "exam_requests" DROP CONSTRAINT "exam_requests_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "exam_results" DROP CONSTRAINT "exam_results_examRequestId_fkey";

-- DropForeignKey
ALTER TABLE "exam_results" DROP CONSTRAINT "exam_results_examScheduleId_fkey";

-- DropForeignKey
ALTER TABLE "exam_schedules" DROP CONSTRAINT "exam_schedules_coordinatorId_fkey";

-- DropForeignKey
ALTER TABLE "exam_schedules" DROP CONSTRAINT "exam_schedules_teacherExaminerId_fkey";

-- DropForeignKey
ALTER TABLE "schedule_requests" DROP CONSTRAINT "schedule_requests_requestId_fkey";

-- DropForeignKey
ALTER TABLE "schedule_requests" DROP CONSTRAINT "schedule_requests_scheduleId_fkey";

-- DropTable
DROP TABLE "exam_requests";

-- DropTable
DROP TABLE "exam_results";

-- DropTable
DROP TABLE "exam_schedules";

-- DropTable
DROP TABLE "schedule_requests";

-- DropEnum
DROP TYPE "ExamRequestStatus";

-- DropEnum
DROP TYPE "ExamType";

-- CreateTable
CREATE TABLE "tashih_requests" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "juzId" INTEGER,
    "surahId" INTEGER,
    "notes" TEXT,
    "status" "TashihRequestStatus" NOT NULL DEFAULT 'MENUNGGU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tashih_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tashih_schedule_requests" (
    "scheduleId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,

    CONSTRAINT "tashih_schedule_requests_pkey" PRIMARY KEY ("scheduleId","requestId")
);

-- CreateTable
CREATE TABLE "tashih_schedules" (
    "id" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessionName" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tashih_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tashih_results" (
    "id" TEXT NOT NULL,
    "tashihScheduleId" TEXT NOT NULL,
    "tashihRequestId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "grade" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tashih_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tashih_schedules_date_sessionName_startTime_endTime_locatio_key" ON "tashih_schedules"("date", "sessionName", "startTime", "endTime", "location");

-- CreateIndex
CREATE UNIQUE INDEX "tashih_results_tashihScheduleId_tashihRequestId_key" ON "tashih_results"("tashihScheduleId", "tashihRequestId");

-- AddForeignKey
ALTER TABLE "tashih_requests" ADD CONSTRAINT "tashih_requests_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_requests" ADD CONSTRAINT "tashih_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_requests" ADD CONSTRAINT "tashih_requests_juzId_fkey" FOREIGN KEY ("juzId") REFERENCES "juz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_requests" ADD CONSTRAINT "tashih_requests_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "surah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_schedule_requests" ADD CONSTRAINT "tashih_schedule_requests_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "tashih_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_schedule_requests" ADD CONSTRAINT "tashih_schedule_requests_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "tashih_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_schedules" ADD CONSTRAINT "tashih_schedules_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "coordinator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_results" ADD CONSTRAINT "tashih_results_tashihScheduleId_fkey" FOREIGN KEY ("tashihScheduleId") REFERENCES "tashih_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_results" ADD CONSTRAINT "tashih_results_tashihRequestId_fkey" FOREIGN KEY ("tashihRequestId") REFERENCES "tashih_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
