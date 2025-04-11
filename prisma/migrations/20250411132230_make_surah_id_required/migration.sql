/*
  Warnings:

  - Made the column `surahId` on table `Setoran` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Setoran" ALTER COLUMN "surahId" SET NOT NULL;
