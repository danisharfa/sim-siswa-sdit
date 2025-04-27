/*
  Warnings:

  - The values [TAHSIN] on the enum `JenisSetoran` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JenisSetoran_new" AS ENUM ('TAHFIDZ', 'TAHSIN_WAFA', 'TAHSIN_ALQURAN');
ALTER TABLE "Setoran" ALTER COLUMN "jenisSetoran" TYPE "JenisSetoran_new" USING ("jenisSetoran"::text::"JenisSetoran_new");
ALTER TYPE "JenisSetoran" RENAME TO "JenisSetoran_old";
ALTER TYPE "JenisSetoran_new" RENAME TO "JenisSetoran";
DROP TYPE "JenisSetoran_old";
COMMIT;
