/*
  Warnings:

  - You are about to drop the column `juz` on the `exam_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "exam_requests" DROP COLUMN "juz",
ADD COLUMN     "juzId" INTEGER;

-- AddForeignKey
ALTER TABLE "exam_requests" ADD CONSTRAINT "exam_requests_juzId_fkey" FOREIGN KEY ("juzId") REFERENCES "juz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
