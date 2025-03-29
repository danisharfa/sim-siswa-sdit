import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { kelasId: string } }
) {
  try {
    const { kelasId } = params;

    const siswaList = await prisma.siswaProfile.findMany({
      where: { kelasId },
      include: { user: true }, // Ambil informasi akun siswa
    });

    return NextResponse.json(siswaList);
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { kelasId: string } }
) {
  try {
    const { siswaId } = await req.json();
    const { kelasId } = params;

    const siswa = await prisma.siswaProfile.findUnique({
      where: { id: siswaId },
    });

    if (!siswa) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Update kelasId pada SiswaProfile
    await prisma.siswaProfile.update({
      where: { id: siswaId },
      data: { kelasId },
    });

    return NextResponse.json({
      message: 'Siswa berhasil ditambahkan ke kelas',
    });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
