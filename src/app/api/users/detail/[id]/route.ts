import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    console.log('GET detail user dengan id:', id);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        siswaProfile: true,
        guruProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengambil data pengguna' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const id = params.id;

  try {
    const {
      namaLengkap,
      role,
      nis,
      nip,
      tanggalLahir,
      tempatLahir,
      jenisKelamin,
      golonganDarah,
      agama,
      alamat,
      noTelp,
      email,
    } = await req.json();

    // Update tabel User
    await prisma.user.update({
      where: { id },
      data: {
        namaLengkap,
      },
    });

    if (role === 'student') {
      await prisma.siswaProfile.update({
        where: { userId: id },
        data: {
          nis,
          tanggalLahir,
          tempatLahir,
          jenisKelamin,
          golonganDarah,
          agama,
          alamat,
          noTelp,
          email,
        },
      });
    } else if (role === 'teacher') {
      await prisma.guruProfile.update({
        where: { userId: id },
        data: {
          nip,
          tanggalLahir,
          tempatLahir,
          jenisKelamin,
          golonganDarah,
          agama,
          alamat,
          noTelp,
          email,
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        siswaProfile: true,
        guruProfile: true,
      },
    });

    return NextResponse.json({
      message: 'User updated successfully',
      updatedUser,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Failed to update user', error },
      { status: 500 }
    );
  }
}
