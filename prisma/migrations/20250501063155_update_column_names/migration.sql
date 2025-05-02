/*
  Warnings:

  - You are about to drop the `GuruKelompok` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GuruProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GuruTes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Kelas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Kelompok` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RiwayatKelas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RiwayatKelompok` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setoran` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SiswaProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Surah` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SurahJuz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wafa` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('PILIH', 'LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('PILIH', 'A', 'B', 'AB', 'O');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('LULUS', 'TIDAK_LULUS', 'MENGULANG');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('TAHFIDZ', 'TAHSIN_WAFA', 'TAHSIN_ALQURAN');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'coordinator';

-- DropForeignKey
ALTER TABLE "GuruKelompok" DROP CONSTRAINT "GuruKelompok_guruId_fkey";

-- DropForeignKey
ALTER TABLE "GuruKelompok" DROP CONSTRAINT "GuruKelompok_kelompokId_fkey";

-- DropForeignKey
ALTER TABLE "GuruProfile" DROP CONSTRAINT "GuruProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "GuruTes" DROP CONSTRAINT "GuruTes_guruId_fkey";

-- DropForeignKey
ALTER TABLE "Kelompok" DROP CONSTRAINT "Kelompok_kelasId_fkey";

-- DropForeignKey
ALTER TABLE "RiwayatKelas" DROP CONSTRAINT "RiwayatKelas_kelasId_fkey";

-- DropForeignKey
ALTER TABLE "RiwayatKelas" DROP CONSTRAINT "RiwayatKelas_siswaId_fkey";

-- DropForeignKey
ALTER TABLE "RiwayatKelompok" DROP CONSTRAINT "RiwayatKelompok_guruId_fkey";

-- DropForeignKey
ALTER TABLE "RiwayatKelompok" DROP CONSTRAINT "RiwayatKelompok_kelompokId_fkey";

-- DropForeignKey
ALTER TABLE "RiwayatKelompok" DROP CONSTRAINT "RiwayatKelompok_siswaId_fkey";

-- DropForeignKey
ALTER TABLE "Setoran" DROP CONSTRAINT "Setoran_guruId_fkey";

-- DropForeignKey
ALTER TABLE "Setoran" DROP CONSTRAINT "Setoran_kelompokId_fkey";

-- DropForeignKey
ALTER TABLE "Setoran" DROP CONSTRAINT "Setoran_siswaId_fkey";

-- DropForeignKey
ALTER TABLE "Setoran" DROP CONSTRAINT "Setoran_surahId_fkey";

-- DropForeignKey
ALTER TABLE "Setoran" DROP CONSTRAINT "Setoran_wafaId_fkey";

-- DropForeignKey
ALTER TABLE "SiswaProfile" DROP CONSTRAINT "SiswaProfile_kelasId_fkey";

-- DropForeignKey
ALTER TABLE "SiswaProfile" DROP CONSTRAINT "SiswaProfile_kelompokId_fkey";

-- DropForeignKey
ALTER TABLE "SiswaProfile" DROP CONSTRAINT "SiswaProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "SurahJuz" DROP CONSTRAINT "SurahJuz_surahId_fkey";

-- DropTable
DROP TABLE "GuruKelompok";

-- DropTable
DROP TABLE "GuruProfile";

-- DropTable
DROP TABLE "GuruTes";

-- DropTable
DROP TABLE "Kelas";

-- DropTable
DROP TABLE "Kelompok";

-- DropTable
DROP TABLE "RiwayatKelas";

-- DropTable
DROP TABLE "RiwayatKelompok";

-- DropTable
DROP TABLE "Setoran";

-- DropTable
DROP TABLE "SiswaProfile";

-- DropTable
DROP TABLE "Surah";

-- DropTable
DROP TABLE "SurahJuz";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Wafa";

-- DropEnum
DROP TYPE "GolonganDarah";

-- DropEnum
DROP TYPE "JenisKelamin";

-- DropEnum
DROP TYPE "JenisSetoran";

-- DropEnum
DROP TYPE "StatusSetoran";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "gender" "Gender" DEFAULT 'PILIH',
    "bloodType" "BloodType" DEFAULT 'PILIH',
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "coordinator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "gender" "Gender" DEFAULT 'PILIH',
    "bloodType" "BloodType" DEFAULT 'PILIH',
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "classroomId" TEXT,
    "groupId" TEXT,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "gender" "Gender" DEFAULT 'PILIH',
    "bloodType" "BloodType" DEFAULT 'PILIH',
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_histories" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "classroom_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_groups" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "teacher_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_histories" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "teacherId" TEXT,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "group_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "juz" INTEGER,
    "surahId" INTEGER,
    "startVerse" INTEGER,
    "endVerse" INTEGER,
    "wafaId" INTEGER,
    "startPage" INTEGER,
    "endPage" INTEGER,
    "adab" "Adab" NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surah" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "verseCount" INTEGER NOT NULL,

    CONSTRAINT "surah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surah_juz" (
    "id" SERIAL NOT NULL,
    "juz" INTEGER NOT NULL,
    "surahId" INTEGER NOT NULL,
    "startVerse" INTEGER NOT NULL,
    "endVerse" INTEGER NOT NULL,

    CONSTRAINT "surah_juz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wafa" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "wafa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_profiles_id_key" ON "coordinator_profiles"("id");

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_profiles_userId_key" ON "coordinator_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_profiles_nip_key" ON "coordinator_profiles"("nip");

-- CreateIndex
CREATE INDEX "coordinator_profiles_nip_idx" ON "coordinator_profiles"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_id_key" ON "teacher_profiles"("id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_userId_key" ON "teacher_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_nip_key" ON "teacher_profiles"("nip");

-- CreateIndex
CREATE INDEX "teacher_profiles_nip_idx" ON "teacher_profiles"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_id_key" ON "student_profiles"("id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_nis_key" ON "student_profiles"("nis");

-- CreateIndex
CREATE INDEX "student_profiles_nis_idx" ON "student_profiles"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_id_key" ON "classrooms"("id");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_name_academicYear_key" ON "classrooms"("name", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "groups_id_key" ON "groups"("id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_classroomId_academicYear_key" ON "groups"("name", "classroomId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_id_key" ON "submissions"("id");

-- CreateIndex
CREATE INDEX "submissions_date_idx" ON "submissions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "surah_name_key" ON "surah"("name");

-- CreateIndex
CREATE INDEX "surah_juz_juz_idx" ON "surah_juz"("juz");

-- CreateIndex
CREATE UNIQUE INDEX "wafa_name_key" ON "wafa"("name");

-- AddForeignKey
ALTER TABLE "coordinator_profiles" ADD CONSTRAINT "coordinator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_histories" ADD CONSTRAINT "classroom_histories_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_histories" ADD CONSTRAINT "classroom_histories_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_groups" ADD CONSTRAINT "teacher_groups_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_groups" ADD CONSTRAINT "teacher_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_histories" ADD CONSTRAINT "group_histories_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_histories" ADD CONSTRAINT "group_histories_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_histories" ADD CONSTRAINT "group_histories_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "surah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_wafaId_fkey" FOREIGN KEY ("wafaId") REFERENCES "wafa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surah_juz" ADD CONSTRAINT "surah_juz_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "surah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
