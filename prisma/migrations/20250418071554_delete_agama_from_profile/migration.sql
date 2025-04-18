/*
  Warnings:

  - You are about to drop the column `agama` on the `GuruProfile` table. All the data in the column will be lost.
  - You are about to drop the column `agama` on the `SiswaProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GuruProfile" DROP COLUMN "agama";

-- AlterTable
ALTER TABLE "SiswaProfile" DROP COLUMN "agama";
