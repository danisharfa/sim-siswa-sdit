/*
  Warnings:

  - Made the column `jenisSetoran` on table `Setoran` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Setoran" ALTER COLUMN "jenisSetoran" SET NOT NULL;

-- CreateTable
CREATE TABLE "SurahJuz" (
    "id" SERIAL NOT NULL,
    "juz" INTEGER NOT NULL,
    "surahId" INTEGER NOT NULL,
    "ayatAwal" INTEGER NOT NULL,
    "ayatAkhir" INTEGER NOT NULL,

    CONSTRAINT "SurahJuz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurahJuz_juz_idx" ON "SurahJuz"("juz");

-- AddForeignKey
ALTER TABLE "SurahJuz" ADD CONSTRAINT "SurahJuz_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "Surah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
