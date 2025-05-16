/*
  Warnings:

  - You are about to drop the column `aspect` on the `tahsin_scores` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,academicYear,semester,tahsinType,topic]` on the table `tahsin_scores` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tahsinType` to the `tahsin_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topic` to the `tahsin_scores` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TahsinType" AS ENUM ('WAFA', 'ALQURAN');

-- DropIndex
DROP INDEX "tahsin_scores_studentId_academicYear_semester_aspect_key";

-- AlterTable
ALTER TABLE "tahsin_scores" DROP COLUMN "aspect",
ADD COLUMN     "tahsinType" "TahsinType" NOT NULL,
ADD COLUMN     "topic" TEXT NOT NULL;

-- DropEnum
DROP TYPE "TahsinAspect";

-- CreateIndex
CREATE UNIQUE INDEX "tahsin_scores_studentId_academicYear_semester_tahsinType_to_key" ON "tahsin_scores"("studentId", "academicYear", "semester", "tahsinType", "topic");
