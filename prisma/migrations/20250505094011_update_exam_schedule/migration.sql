/*
  Warnings:

  - A unique constraint covering the columns `[date,sessionName,startTime,endTime,location]` on the table `exam_schedules` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "exam_schedules_date_sessionName_startTime_endTime_location_key" ON "exam_schedules"("date", "sessionName", "startTime", "endTime", "location");
