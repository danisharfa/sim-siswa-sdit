/*
  Warnings:

  - Made the column `siswaId` on table `Setoran` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Setoran" DROP CONSTRAINT "Setoran_siswaId_fkey";

-- DropIndex
DROP INDEX "SiswaProfile_id_key";

-- DropIndex
DROP INDEX "SiswaProfile_kelasId_key";

-- AlterTable
ALTER TABLE "Setoran" ALTER COLUMN "siswaId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Setoran_tanggal_idx" ON "Setoran"("tanggal");

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "SiswaProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
