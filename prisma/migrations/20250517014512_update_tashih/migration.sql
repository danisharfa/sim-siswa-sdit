/*
  Warnings:

  - Added the required column `classroomId` to the `tashih_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classroomName` to the `tashih_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `tashih_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupName` to the `tashih_requests` table without a default value. This is not possible if the table is not empty.
  - Made the column `academicYear` on table `tashih_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `semester` on table `tashih_requests` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `scheduledByCoordinatorId` to the `tashih_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tashih_schedules" DROP CONSTRAINT "tashih_schedules_coordinatorId_fkey";

-- AlterTable
ALTER TABLE "tashih_requests" ADD COLUMN     "classroomId" TEXT NOT NULL,
ADD COLUMN     "classroomName" TEXT NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "groupName" TEXT NOT NULL,
ADD COLUMN     "handledByCoordinatorId" TEXT,
ALTER COLUMN "academicYear" SET NOT NULL,
ALTER COLUMN "semester" SET NOT NULL;

-- AlterTable
ALTER TABLE "tashih_results" ADD COLUMN     "evaluatedByCoordinatorId" TEXT;

-- AlterTable
ALTER TABLE "tashih_schedules" ADD COLUMN     "scheduledByCoordinatorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "tashih_requests" ADD CONSTRAINT "tashih_requests_handledByCoordinatorId_fkey" FOREIGN KEY ("handledByCoordinatorId") REFERENCES "coordinator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_schedules" ADD CONSTRAINT "tashih_schedules_scheduledByCoordinatorId_fkey" FOREIGN KEY ("scheduledByCoordinatorId") REFERENCES "coordinator_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tashih_results" ADD CONSTRAINT "tashih_results_evaluatedByCoordinatorId_fkey" FOREIGN KEY ("evaluatedByCoordinatorId") REFERENCES "coordinator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
