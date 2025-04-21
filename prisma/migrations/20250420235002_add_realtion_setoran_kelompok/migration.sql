-- AlterTable
ALTER TABLE "Setoran" ADD COLUMN     "kelompokId" TEXT;

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES "Kelompok"("id") ON DELETE SET NULL ON UPDATE CASCADE;
