/*
  Warnings:

  - You are about to drop the column `status` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `submissions` table. All the data in the column will be lost.
  - Added the required column `submissionStatus` to the `submissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submissionType` to the `submissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "submissionStatus" "SubmissionStatus" NOT NULL,
ADD COLUMN     "submissionType" "SubmissionType" NOT NULL;
