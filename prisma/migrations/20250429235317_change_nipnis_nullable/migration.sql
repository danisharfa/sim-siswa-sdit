/*
  Warnings:

  - Made the column `nip` on table `GuruProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nis` on table `SiswaProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GuruProfile" ALTER COLUMN "nip" SET NOT NULL;

-- AlterTable
ALTER TABLE "SiswaProfile" ALTER COLUMN "nis" SET NOT NULL;
