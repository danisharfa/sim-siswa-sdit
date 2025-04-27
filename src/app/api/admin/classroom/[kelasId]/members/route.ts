import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ kelasId: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const kelasId = params.kelasId;

  if (!kelasId) {
    return NextResponse.json({ error: 'kelasId is required' }, { status: 400 });
  }

  try {
    const siswaList = await prisma.siswaProfile.findMany({
      where: { kelasId },
      include: { user: true },
    });

    return NextResponse.json(siswaList);
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const kelasId = params.kelasId;
    const { nis } = await req.json();

    if (!nis || !kelasId) {
      return NextResponse.json(
        {
          error: 'Data tidak lengkap. Pastikan NIS dan kelasId diisi.',
        },
        { status: 400 }
      );
    }

    const siswa = await prisma.siswaProfile.findUnique({
      where: { nis },
    });

    if (!siswa) {
      return NextResponse.json(
        { error: 'Siswa dengan NIS tersebut tidak ditemukan' },
        { status: 404 }
      );
    }

    if (siswa.kelasId === kelasId) {
      return NextResponse.json(
        { error: 'Siswa sudah tergabung dalam kelas ini' },
        { status: 409 }
      );
    }

    await prisma.siswaProfile.update({
      where: { id: siswa.id },
      data: { kelasId },
    });

    return NextResponse.json({
      message: 'Siswa berhasil ditambahkan ke kelas',
    });
  } catch (error) {
    console.error('POST /add-member error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const kelasId = params.kelasId;
    const { nis } = await req.json();

    if (!nis || !kelasId) {
      return NextResponse.json(
        { error: 'Data tidak lengkap. Pastikan NIS dan kelasId diisi.' },
        { status: 400 }
      );
    }

    // Cari siswa berdasarkan NIS
    const siswa = await prisma.siswaProfile.findUnique({
      where: { nis },
    });

    if (!siswa) {
      return NextResponse.json(
        { error: 'Siswa dengan NIS tersebut tidak ditemukan' },
        { status: 404 }
      );
    }

    // Pastikan siswa terdaftar di kelas yang sesuai
    if (siswa.kelasId !== kelasId) {
      return NextResponse.json(
        { error: 'Siswa tidak terdaftar di kelas ini' },
        { status: 409 }
      );
    }

    // Update kelasId menjadi null untuk menghapus siswa dari kelas
    await prisma.siswaProfile.update({
      where: { id: siswa.id },
      data: { kelasId: null },
    });

    return NextResponse.json({
      message: 'Siswa berhasil dihapus dari kelas',
    });
  } catch (error) {
    console.error('DELETE /remove-member error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
