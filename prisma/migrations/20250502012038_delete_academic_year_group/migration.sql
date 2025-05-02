/*
  Warnings:

  - You are about to drop the column `academicYear` on the `groups` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,classroomId]` on the table `groups` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "groups_name_classroomId_academicYear_key";

-- AlterTable
ALTER TABLE "groups" DROP COLUMN "academicYear";

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_classroomId_key" ON "groups"("name", "classroomId");
