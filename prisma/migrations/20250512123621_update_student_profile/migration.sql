/*
  Warnings:

  - You are about to drop the column `isGraduated` on the `student_profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('AKTIF', 'LULUS', 'PINDAH', 'KELUAR');

-- AlterTable
ALTER TABLE "student_profiles" DROP COLUMN "isGraduated",
ADD COLUMN     "status" "StudentStatus" NOT NULL DEFAULT 'AKTIF';
