/*
  Warnings:

  - A unique constraint covering the columns `[kelasId]` on the table `SiswaProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SiswaProfile_kelasId_key" ON "SiswaProfile"("kelasId");
