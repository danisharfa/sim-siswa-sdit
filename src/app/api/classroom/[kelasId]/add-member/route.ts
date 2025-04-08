import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ kelasId: string }>;

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const kelasId = params.kelasId;
    const { identifier, role } = await req.json();

    if (!identifier || !role || !kelasId) {
      return NextResponse.json(
        {
          error:
            'Data tidak lengkap. Pastikan identifier, role, dan kelasId diisi.',
        },
        { status: 400 }
      );
    }

    if (role === 'siswa') {
      const siswa = await prisma.siswaProfile.findUnique({
        where: { nis: identifier },
      });

      if (!siswa) {
        return NextResponse.json(
          { error: 'Siswa dengan NIS tersebut tidak ditemukan' },
          { status: 404 }
        );
      }

      // Optional: Cek apakah sudah tergabung dalam kelas
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
    }

    if (role === 'guru') {
      const guru = await prisma.guruProfile.findUnique({
        where: { nip: identifier },
      });

      if (!guru) {
        return NextResponse.json(
          { error: 'Guru dengan NIP tersebut tidak ditemukan' },
          { status: 404 }
        );
      }

      const existing = await prisma.guruKelas.findFirst({
        where: { guruId: guru.id, kelasId },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Guru sudah tergabung dalam kelas ini' },
          { status: 409 }
        );
      }

      await prisma.guruKelas.create({
        data: {
          guruId: guru.id,
          kelasId,
        },
      });

      return NextResponse.json({
        message: 'Guru berhasil ditambahkan ke kelas',
      });
    }

    return NextResponse.json({ error: 'Peran tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('POST /add-member error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
