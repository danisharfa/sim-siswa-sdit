/*
  Warnings:

  - You are about to drop the column `nama` on the `Kelompok` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[namaKelompok,kelasId,tahunAjaran]` on the table `Kelompok` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Kelompok_nama_kelasId_tahunAjaran_key";

-- AlterTable
ALTER TABLE "Kelompok" DROP COLUMN "nama",
ADD COLUMN     "namaKelompok" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Kelompok_namaKelompok_kelasId_tahunAjaran_key" ON "Kelompok"("namaKelompok", "kelasId", "tahunAjaran");
