-- DropForeignKey
ALTER TABLE "GuruProfile" DROP CONSTRAINT "GuruProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "SiswaProfile" DROP CONSTRAINT "SiswaProfile_userId_fkey";

-- AddForeignKey
ALTER TABLE "SiswaProfile" ADD CONSTRAINT "SiswaProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruProfile" ADD CONSTRAINT "GuruProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
