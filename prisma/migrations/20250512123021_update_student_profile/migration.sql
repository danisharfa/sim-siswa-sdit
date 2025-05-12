-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "graduatedAt" TIMESTAMP(3),
ADD COLUMN     "isGraduated" BOOLEAN NOT NULL DEFAULT false;
