/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Setoran` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Setoran_id_key" ON "Setoran"("id");
