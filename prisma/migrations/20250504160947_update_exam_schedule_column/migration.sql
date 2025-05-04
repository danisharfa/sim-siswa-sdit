/*
  Warnings:

  - You are about to drop the column `scheduledAt` on the `exam_schedules` table. All the data in the column will be lost.
  - Added the required column `date` to the `exam_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `exam_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionName` to the `exam_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `exam_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "exam_schedules" DROP COLUMN "scheduledAt",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "sessionName" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL;
