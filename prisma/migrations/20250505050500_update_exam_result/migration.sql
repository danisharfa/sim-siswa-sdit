/*
  Warnings:

  - A unique constraint covering the columns `[examScheduleId,examRequestId]` on the table `exam_results` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `examRequestId` to the `exam_results` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "exam_results_examScheduleId_key";

-- AlterTable
ALTER TABLE "exam_results" ADD COLUMN     "examRequestId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_examScheduleId_examRequestId_key" ON "exam_results"("examScheduleId", "examRequestId");

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_examRequestId_fkey" FOREIGN KEY ("examRequestId") REFERENCES "exam_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
