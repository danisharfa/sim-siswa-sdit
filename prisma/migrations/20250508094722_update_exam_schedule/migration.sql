/*
  Warnings:

  - Added the required column `grade` to the `exam_results` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ExamType" ADD VALUE 'TASMI';

-- AlterTable
ALTER TABLE "exam_results" ADD COLUMN     "grade" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "exam_schedules" ADD COLUMN     "teacherExaminerId" TEXT;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_teacherExaminerId_fkey" FOREIGN KEY ("teacherExaminerId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
