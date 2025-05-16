-- CreateEnum
CREATE TYPE "GradeLetter" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "TahsinAspect" AS ENUM ('ISYMAM', 'IMALAH', 'SIFRUL_MUSTATHIL', 'SAKTAH', 'BAROAH');

-- AlterTable
ALTER TABLE "wafa" ADD COLUMN     "pageCount" INTEGER;

-- CreateTable
CREATE TABLE "tahfidz_scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "surahId" INTEGER NOT NULL,
    "scoreNumeric" INTEGER NOT NULL,
    "scoreLetter" "GradeLetter" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tahfidz_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahfidz_summaries" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "averageScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tahfidz_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahsin_scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "aspect" "TahsinAspect" NOT NULL,
    "scoreNumeric" INTEGER NOT NULL,
    "scoreLetter" "GradeLetter" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tahsin_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahsin_summaries" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "lastMaterial" TEXT,
    "averageScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tahsin_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tahfidz_scores_studentId_academicYear_semester_surahId_key" ON "tahfidz_scores"("studentId", "academicYear", "semester", "surahId");

-- CreateIndex
CREATE UNIQUE INDEX "tahfidz_summaries_studentId_academicYear_semester_key" ON "tahfidz_summaries"("studentId", "academicYear", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "tahsin_scores_studentId_academicYear_semester_aspect_key" ON "tahsin_scores"("studentId", "academicYear", "semester", "aspect");

-- CreateIndex
CREATE UNIQUE INDEX "tahsin_summaries_studentId_academicYear_semester_key" ON "tahsin_summaries"("studentId", "academicYear", "semester");

-- AddForeignKey
ALTER TABLE "tahfidz_scores" ADD CONSTRAINT "tahfidz_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahfidz_scores" ADD CONSTRAINT "tahfidz_scores_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "surah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahfidz_summaries" ADD CONSTRAINT "tahfidz_summaries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahsin_scores" ADD CONSTRAINT "tahsin_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahsin_summaries" ADD CONSTRAINT "tahsin_summaries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
