/*
  Warnings:

  - You are about to drop the column `examRequestId` on the `exam_schedules` table. All the data in the column will be lost.
  - You are about to drop the `ScheduleRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ScheduleRequest" DROP CONSTRAINT "ScheduleRequest_requestId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleRequest" DROP CONSTRAINT "ScheduleRequest_scheduleId_fkey";

-- DropIndex
DROP INDEX "exam_schedules_examRequestId_key";

-- AlterTable
ALTER TABLE "exam_schedules" DROP COLUMN "examRequestId";

-- DropTable
DROP TABLE "ScheduleRequest";

-- CreateTable
CREATE TABLE "schedule_requests" (
    "scheduleId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,

    CONSTRAINT "schedule_requests_pkey" PRIMARY KEY ("scheduleId","requestId")
);

-- AddForeignKey
ALTER TABLE "schedule_requests" ADD CONSTRAINT "schedule_requests_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "exam_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_requests" ADD CONSTRAINT "schedule_requests_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "exam_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
