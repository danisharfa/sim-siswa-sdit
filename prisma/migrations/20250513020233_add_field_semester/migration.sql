/*
  Warnings:

  - A unique constraint covering the columns `[studentId,academicYear,semester]` on the table `classroom_histories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,academicYear,semester]` on the table `classrooms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,academicYear,semester]` on the table `group_histories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `semester` to the `classroom_histories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `classrooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `group_histories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYear` to the `submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `submissions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('GANJIL', 'GENAP');

-- DropIndex
DROP INDEX "classrooms_name_academicYear_key";

-- AlterTable
ALTER TABLE "classroom_histories" ADD COLUMN     "semester" "Semester" NOT NULL;

-- AlterTable
ALTER TABLE "classrooms" ADD COLUMN     "semester" "Semester" NOT NULL;

-- AlterTable
ALTER TABLE "group_histories" ADD COLUMN     "semester" "Semester" NOT NULL;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "academicYear" TEXT NOT NULL,
ADD COLUMN     "semester" "Semester" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "classroom_histories_studentId_academicYear_semester_key" ON "classroom_histories"("studentId", "academicYear", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_name_academicYear_semester_key" ON "classrooms"("name", "academicYear", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "group_histories_studentId_academicYear_semester_key" ON "group_histories"("studentId", "academicYear", "semester");
