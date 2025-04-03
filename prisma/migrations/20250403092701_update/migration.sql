-- AlterTable
ALTER TABLE "GuruProfile" ADD COLUMN     "email" TEXT,
ALTER COLUMN "tanggalLahir" DROP NOT NULL,
ALTER COLUMN "tempatLahir" DROP NOT NULL,
ALTER COLUMN "jenisKelamin" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SiswaProfile" ADD COLUMN     "email" TEXT,
ALTER COLUMN "nis" DROP NOT NULL,
ALTER COLUMN "tanggalLahir" DROP NOT NULL,
ALTER COLUMN "tempatLahir" DROP NOT NULL,
ALTER COLUMN "jenisKelamin" DROP NOT NULL;
