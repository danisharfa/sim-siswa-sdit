-- CreateTable
CREATE TABLE "GuruTes" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuruTes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GuruTes" ADD CONSTRAINT "GuruTes_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "GuruProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
