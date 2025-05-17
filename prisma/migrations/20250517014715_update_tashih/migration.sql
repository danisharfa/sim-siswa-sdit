/*
  Warnings:

  - Made the column `evaluatedByCoordinatorId` on table `tashih_results` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "tashih_results" DROP CONSTRAINT "tashih_results_evaluatedByCoordinatorId_fkey";

-- AlterTable
ALTER TABLE "tashih_results" ALTER COLUMN "evaluatedByCoordinatorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tashih_results" ADD CONSTRAINT "tashih_results_evaluatedByCoordinatorId_fkey" FOREIGN KEY ("evaluatedByCoordinatorId") REFERENCES "coordinator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
