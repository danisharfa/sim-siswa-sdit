import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const members = await prisma.siswaProfile.findMany({
      where: { kelompokId: id },
      include: { user: true },
    });

    return NextResponse.json(members);
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengambil data anggota kelompok' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;
    const { nis } = await req.json();

    if (!nis || !id) {
      return NextResponse.json(
        { error: 'NIS dan id wajib diisi' },
        { status: 400 }
      );
    }

    const siswa = await prisma.siswaProfile.findUnique({ where: { nis } });

    if (!siswa) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }
    const kelompok = await prisma.kelompok.findUnique({ where: { id } });
    if (!kelompok) {
      return NextResponse.json(
        { error: 'Kelompok tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi: siswa harus berada di kelas yang sama dengan kelompok
    if (siswa.kelasId !== kelompok.kelasId) {
      return NextResponse.json(
        {
          error:
            'Siswa harus berada di kelas yang sama dengan kelas kelompok ini',
        },
        { status: 400 }
      );
    }

    // Cek apakah siswa sudah tergabung dalam kelompok yang sama
    if (siswa.kelompokId === id) {
      return NextResponse.json(
        { error: 'Siswa sudah tergabung dalam kelompok ini' },
        { status: 409 }
      );
    }

    // Update siswa untuk bergabung ke kelompok
    await prisma.siswaProfile.update({
      where: { id: siswa.id },
      data: { kelompokId: id },
    });

    return NextResponse.json({
      message: 'Siswa berhasil ditambahkan ke kelompok',
    });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
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
    const id = params.id;
    const { nis } = await req.json();

    if (!id || !nis) {
      return NextResponse.json(
        { error: 'ID dan NIS wajib diisi' },
        { status: 400 }
      );
    }

    const siswa = await prisma.siswaProfile.findUnique({ where: { nis } });

    if (!siswa || siswa.kelompokId !== id) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan di kelompok ini' },
        { status: 404 }
      );
    }

    await prisma.siswaProfile.update({
      where: { id: siswa.id },
      data: { kelompokId: null },
    });

    return NextResponse.json({
      message: 'Siswa berhasil dikeluarkan dari kelompok',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
