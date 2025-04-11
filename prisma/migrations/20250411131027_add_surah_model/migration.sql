/*
  Warnings:

  - You are about to drop the column `surah` on the `Setoran` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Setoran" DROP COLUMN "surah",
ADD COLUMN     "surahId" INTEGER;

-- CreateTable
CREATE TABLE "Surah" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "jumlahAyat" INTEGER NOT NULL,

    CONSTRAINT "Surah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Surah_nama_key" ON "Surah"("nama");

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "Surah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
