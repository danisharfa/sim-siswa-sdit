-- DropForeignKey
ALTER TABLE "Setoran" DROP CONSTRAINT "Setoran_surahId_fkey";

-- AlterTable
ALTER TABLE "GuruProfile" ALTER COLUMN "jenisKelamin" SET DEFAULT 'PILIH',
ALTER COLUMN "golonganDarah" SET DEFAULT 'PILIH';

-- AlterTable
ALTER TABLE "Setoran" ADD COLUMN     "halamanMulai" INTEGER,
ADD COLUMN     "halamanSelesai" INTEGER,
ADD COLUMN     "juz" INTEGER,
ADD COLUMN     "wafaId" INTEGER,
ALTER COLUMN "ayatMulai" DROP NOT NULL,
ALTER COLUMN "ayatSelesai" DROP NOT NULL,
ALTER COLUMN "surahId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SiswaProfile" ALTER COLUMN "jenisKelamin" SET DEFAULT 'PILIH',
ALTER COLUMN "golonganDarah" SET DEFAULT 'PILIH';

-- CreateTable
CREATE TABLE "Wafa" (
    "id" SERIAL NOT NULL,
    "namaBuku" TEXT NOT NULL,

    CONSTRAINT "Wafa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wafa_namaBuku_key" ON "Wafa"("namaBuku");

-- CreateIndex
CREATE INDEX "GuruProfile_nip_idx" ON "GuruProfile"("nip");

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_wafaId_fkey" FOREIGN KEY ("wafaId") REFERENCES "Wafa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "Surah"("id") ON DELETE SET NULL ON UPDATE CASCADE;
