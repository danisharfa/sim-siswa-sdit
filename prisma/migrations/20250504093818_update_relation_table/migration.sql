/*
  Warnings:

  - You are about to drop the column `juz` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `juz` on the `surah_juz` table. All the data in the column will be lost.
  - Added the required column `juzId` to the `surah_juz` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "exam_schedules" DROP CONSTRAINT "exam_schedules_examRequestId_fkey";

-- DropIndex
DROP INDEX "surah_juz_juz_idx";

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "juz",
ADD COLUMN     "juzId" INTEGER;

-- AlterTable
ALTER TABLE "surah_juz" DROP COLUMN "juz",
ADD COLUMN     "juzId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "juz" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "juz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRequest" (
    "scheduleId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,

    CONSTRAINT "ScheduleRequest_pkey" PRIMARY KEY ("scheduleId","requestId")
);

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_juzId_fkey" FOREIGN KEY ("juzId") REFERENCES "juz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surah_juz" ADD CONSTRAINT "surah_juz_juzId_fkey" FOREIGN KEY ("juzId") REFERENCES "juz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRequest" ADD CONSTRAINT "ScheduleRequest_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "exam_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRequest" ADD CONSTRAINT "ScheduleRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "exam_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
