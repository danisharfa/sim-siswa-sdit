import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const kelasList = await prisma.kelas.findMany({
      orderBy: {
        namaKelas: 'asc',
      },
    });

    return NextResponse.json(kelasList, { status: 200 });
  } catch (error) {
    console.error('Error fetching kelas data:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data kelas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Cek apakah request memiliki body JSON yang valid
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Body request tidak valid' },
        { status: 400 }
      );
    }

    const { namaKelas, tahunAjaran } = body;

    // Validasi input agar tidak kosong
    if (!namaKelas || !tahunAjaran) {
      return NextResponse.json(
        { error: 'Nama kelas dan tahun ajaran wajib diisi' },
        { status: 400 }
      );
    }

    // Pastikan namaKelas dan tahunAjaran bersifat unik
    const existingClass = await prisma.kelas.findFirst({
      where: { namaKelas, tahunAjaran },
    });

    if (existingClass) {
      return NextResponse.json({ error: 'Kelas sudah ada' }, { status: 400 });
    }

    // Generate ID untuk kelas
    const kelasId = `KELAS-${crypto.randomUUID()}`;

    const kelas = await prisma.kelas.create({
      data: { id: kelasId, namaKelas, tahunAjaran },
    });

    return NextResponse.json(kelas, { status: 201 });
  } catch (error) {
    console.error('Error creating kelas:', error);
    return NextResponse.json({ error: 'Gagal membuat kelas' }, { status: 500 });
  }
}
