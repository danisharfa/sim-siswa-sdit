import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Generate custom ID
  const generateCustomId = (prefix: string) =>
    `${prefix}-${crypto.randomUUID()}`;

  // Create Admin User
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await argon2.hash('admin'),
      role: 'admin',
      namaLengkap: 'Administrator',
    },
  });

  // Create Teacher User
  const teacher = await prisma.user.upsert({
    where: { username: 'teacher1' },
    update: {},
    create: {
      username: 'teacher1',
      password: await argon2.hash('teacher1'),
      role: 'teacher',
      namaLengkap: 'Guru 1',
    },
  });

  // Custom ID untuk Guru
  const teacherId = generateCustomId('GURU');

  // Create Teacher Profile
  const teacherProfile = await prisma.guruProfile.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      id: teacherId,
      userId: teacher.id,
      nip: '12345678',
      tanggalLahir: new Date('1980-05-15'),
      tempatLahir: 'Jakarta',
      jenisKelamin: 'LAKI_LAKI',
    },
  });

  // Create Student User
  const student = await prisma.user.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1',
      password: await argon2.hash('student1'),
      role: 'student',
      namaLengkap: 'Siswa 1',
    },
  });

  // Custom ID untuk Kelas
  const kelasId = generateCustomId('KELAS');

  // Create Class
  const kelas = await prisma.kelas.upsert({
    where: {
      nama_tahunAjaran: {
        nama: 'Kelas 1A',
        tahunAjaran: '2024/2025',
      },
    }, // Sesuai dengan unique constraint
    update: {},
    create: {
      id: kelasId,
      nama: 'Kelas 1A',
      tahunAjaran: '2024/2025',
    },
  });

  // Custom ID untuk Siswa
  const siswaId = generateCustomId('SISWA');

  // Create Student Profile
  await prisma.siswaProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      id: siswaId,
      userId: student.id,
      nis: '20250001',
      kelasId: kelas.id,
      tanggalLahir: new Date('2010-08-10'),
      tempatLahir: 'Bandung',
      jenisKelamin: 'LAKI_LAKI',
    },
  });

  // Assign Teacher to Class
  await prisma.guruKelas.create({
    data: {
      guruId: teacherProfile.id,
      kelasId: kelas.id,
    },
  });

  // Custom ID untuk Setoran Hafalan
  const setoranId = generateCustomId('SETORAN');

  // Create Setoran Hafalan
  await prisma.setoran.create({
    data: {
      id: setoranId,
      siswaId: siswaId,
      guruId: teacherProfile.id,
      tanggal: new Date(),
      surah: 'Al-Fatihah',
      ayatMulai: 1,
      ayatSelesai: 7,
      status: 'LULUS',
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
