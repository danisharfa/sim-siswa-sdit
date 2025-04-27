/*
  Warnings:

  - You are about to drop the column `nama` on the `Surah` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[namaSurah]` on the table `Surah` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `namaSurah` to the `Surah` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Surah_nama_key";

-- AlterTable
ALTER TABLE "Surah" DROP COLUMN "nama",
ADD COLUMN     "namaSurah" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Surah_namaSurah_key" ON "Surah"("namaSurah");
