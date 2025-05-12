/*
  Warnings:

  - Added the required column `tashihType` to the `tashih_requests` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TashihType" AS ENUM ('ALQURAN', 'WAFA');

-- AlterTable
ALTER TABLE "tashih_requests" ADD COLUMN     "endPage" INTEGER,
ADD COLUMN     "startPage" INTEGER,
ADD COLUMN     "tashihType" "TashihType" NOT NULL,
ADD COLUMN     "wafaId" INTEGER;

-- AddForeignKey
ALTER TABLE "tashih_requests" ADD CONSTRAINT "tashih_requests_wafaId_fkey" FOREIGN KEY ("wafaId") REFERENCES "wafa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
