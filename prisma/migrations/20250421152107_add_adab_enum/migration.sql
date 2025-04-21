/*
  Warnings:

  - Added the required column `adab` to the `Setoran` table without a default value. This is not possible if the table is not empty.
  - Made the column `kelompokId` on table `Setoran` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Adab" AS ENUM ('BAIK', 'KURANG_BAIK', 'TIDAK_BAIK');

-- DropForeignKey
ALTER TABLE "Setoran" DROP CONSTRAINT "Setoran_kelompokId_fkey";

-- AlterTable
ALTER TABLE "Setoran" DROP COLUMN "adab",
ADD COLUMN     "adab" "Adab" NOT NULL,
ALTER COLUMN "kelompokId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_kelompokId_fkey" FOREIGN KEY ("kelompokId") REFERENCES "Kelompok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
