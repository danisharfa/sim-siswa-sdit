/*
  Warnings:

  - You are about to drop the `GuruKelas` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id]` on the table `SiswaProfile` will be added. If there are existing duplicate values, this will fail.
  - Made the column `guruId` on table `Setoran` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "JenisSetoran" AS ENUM ('TAHFIDZ', 'TAHSIN');

-- DropForeignKey
ALTER TABLE "GuruKelas" DROP CONSTRAINT "GuruKelas_guruId_fkey";

-- DropForeignKey
ALTER TABLE "GuruKelas" DROP CONSTRAINT "GuruKelas_kelasId_fkey";

-- DropForeignKey
ALTER TABLE "Setoran" DROP CONSTRAINT "Setoran_guruId_fkey";

-- AlterTable
ALTER TABLE "Setoran" ADD COLUMN     "adab" TEXT,
ADD COLUMN     "jenisSetoran" "JenisSetoran",
ALTER COLUMN "guruId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SiswaProfile" ADD COLUMN     "kelompokId" TEXT;

-- DropTable
DROP TABLE "GuruKelas";

-- CreateTable
CREATE TABLE "GuruKelompok" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "kelompokId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuruKelompok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelompok" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "tahunAjaran" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kelompok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatKelompok" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "kelompokId" TEXT NOT NULL,
    "guruId" TEXT,
    "tahunAjaran" TEXT NOT NULL,
    "tanggalGabung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiwayatKelompok_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kelompok_id_key" ON "Kelompok"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Kelompok_nama_kelasId_tahunAjaran_key" ON "Kelompok"("nama", "kelasId", "tahunAjaran");

-- CreateIndex
CREATE UNIQUE INDEX "SiswaProfile_id_key" ON "SiswaProfile"("id");

-- AddForeignKey
ALTER TABLE "SiswaProfile" ADD CONSTRAINT "SiswaProfile_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES "Kelompok"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruKelompok" ADD CONSTRAINT "GuruKelompok_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "GuruProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruKelompok" ADD CONSTRAINT "GuruKelompok_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES "Kelompok"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelompok" ADD CONSTRAINT "Kelompok_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatKelompok" ADD CONSTRAINT "RiwayatKelompok_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "SiswaProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatKelompok" ADD CONSTRAINT "RiwayatKelompok_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES "Kelompok"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatKelompok" ADD CONSTRAINT "RiwayatKelompok_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "GuruProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "GuruProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
