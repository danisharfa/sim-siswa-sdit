-- AlterTable
ALTER TABLE "surah" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "surah_id_seq";

-- AlterTable
ALTER TABLE "surah_juz" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "surah_juz_id_seq";

-- AlterTable
ALTER TABLE "wafa" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "wafa_id_seq";
