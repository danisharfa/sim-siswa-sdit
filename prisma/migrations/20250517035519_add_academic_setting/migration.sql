-- AlterTable
ALTER TABLE "classrooms" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "academic_settings" (
    "id" TEXT NOT NULL,
    "currentYear" TEXT NOT NULL,
    "currentSemester" "Semester" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_settings_pkey" PRIMARY KEY ("id")
);
