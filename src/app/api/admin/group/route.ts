import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const groups = await prisma.kelompok.findMany({
      include: {
        kelas: true,
        guruKelompok: {
          include: {
            guru: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data kelompok berhasil diambil',
      data: groups,
    });
  } catch (error) {
    console.error('Gagal mengambil data kelompok:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data kelompok' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Body request tidak valid' },
        { status: 400 }
      );
    }

    const { namaKelompok, namaKelas, tahunAjaran, nip } = body;

    if (!namaKelompok || !namaKelas || !tahunAjaran || !nip) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    const kelas = await prisma.kelas.findUnique({
      where: {
        namaKelas_tahunAjaran: {
          namaKelas,
          tahunAjaran,
        },
      },
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    const existingGroup = await prisma.kelompok.findFirst({
      where: {
        namaKelompok,
        kelasId: kelas.id,
        tahunAjaran,
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        { success: false, message: 'Kelompok sudah ada di kelas ini' },
        { status: 400 }
      );
    }

    const kelompokId = `KELOMPOK-${crypto.randomUUID()}`;

    const newGroup = await prisma.kelompok.create({
      data: {
        id: kelompokId,
        namaKelompok,
        kelasId: kelas.id,
        tahunAjaran,
      },
    });

    const guru = await prisma.guruProfile.findUnique({ where: { nip } });

    if (!guru) {
      return NextResponse.json(
        {
          success: false,
          message: 'Guru dengan NIP tersebut tidak ditemukan',
        },
        { status: 404 }
      );
    }

    await prisma.guruKelompok.create({
      data: {
        guruId: guru.id,
        kelompokId: newGroup.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kelompok berhasil dibuat',
      data: newGroup,
    });
  } catch (error) {
    console.error('Gagal membuat kelompok:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat kelompok, silakan coba lagi.' },
      { status: 500 }
    );
  }
}
