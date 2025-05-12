/*
  Warnings:

  - You are about to drop the column `grade` on the `tashih_results` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `tashih_results` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tashih_results" DROP COLUMN "grade",
DROP COLUMN "score";
