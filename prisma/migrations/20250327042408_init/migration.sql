-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'teacher', 'student');

-- CreateEnum
CREATE TYPE "StatusSetoran" AS ENUM ('LULUS', 'TIDAK_LULUS', 'MENGULANG');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "GolonganDarah" AS ENUM ('A', 'B', 'AB', 'O');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiswaProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "kelasId" TEXT,
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "tempatLahir" TEXT NOT NULL,
    "jenisKelamin" "JenisKelamin" NOT NULL,
    "golonganDarah" "GolonganDarah",
    "agama" TEXT,
    "alamat" TEXT,
    "noTelp" TEXT,
    "fotoProfil" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiswaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuruProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nip" TEXT,
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "tempatLahir" TEXT NOT NULL,
    "jenisKelamin" "JenisKelamin" NOT NULL,
    "golonganDarah" "GolonganDarah",
    "agama" TEXT,
    "alamat" TEXT,
    "noTelp" TEXT,
    "fotoProfil" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuruProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL,
    "namaKelas" TEXT NOT NULL,
    "tahunAjaran" TEXT NOT NULL,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatKelas" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "tahunAjaran" TEXT NOT NULL,
    "tanggalPindah" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiwayatKelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuruKelas" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuruKelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setoran" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT,
    "guruId" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "surah" TEXT NOT NULL,
    "ayatMulai" INTEGER NOT NULL,
    "ayatSelesai" INTEGER NOT NULL,
    "status" "StatusSetoran" NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setoran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SiswaProfile_id_key" ON "SiswaProfile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SiswaProfile_userId_key" ON "SiswaProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SiswaProfile_nis_key" ON "SiswaProfile"("nis");

-- CreateIndex
CREATE INDEX "SiswaProfile_nis_idx" ON "SiswaProfile"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "GuruProfile_id_key" ON "GuruProfile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "GuruProfile_userId_key" ON "GuruProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuruProfile_nip_key" ON "GuruProfile"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_id_key" ON "Kelas"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_namaKelas_tahunAjaran_key" ON "Kelas"("namaKelas", "tahunAjaran");

-- AddForeignKey
ALTER TABLE "SiswaProfile" ADD CONSTRAINT "SiswaProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiswaProfile" ADD CONSTRAINT "SiswaProfile_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruProfile" ADD CONSTRAINT "GuruProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatKelas" ADD CONSTRAINT "RiwayatKelas_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "SiswaProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatKelas" ADD CONSTRAINT "RiwayatKelas_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruKelas" ADD CONSTRAINT "GuruKelas_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "GuruProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruKelas" ADD CONSTRAINT "GuruKelas_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "SiswaProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "GuruProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
