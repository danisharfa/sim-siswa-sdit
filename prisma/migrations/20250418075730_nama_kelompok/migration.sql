/*
  Warnings:

  - Made the column `namaKelompok` on table `Kelompok` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Kelompok" ALTER COLUMN "namaKelompok" SET NOT NULL;
