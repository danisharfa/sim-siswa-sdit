import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUser();

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const guru = await prisma.guruProfile.findUnique({
      where: { userId: user.id },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, message: 'Profil guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const kelompokBinaan = await prisma.guruKelompok.findMany({
      where: { guruId: guru.id },
      select: { kelompokId: true },
    });

    const kelompokIds = kelompokBinaan.map((item) => item.kelompokId);

    // Ambil data setoran dari kelompok yang dibimbing guru
    const setoranList = await prisma.setoran.findMany({
      where: {
        guruId: guru.id,
        kelompokId: {
          in: kelompokIds,
        },
      },
      orderBy: {
        tanggal: 'desc',
      },
      include: {
        surah: {
          select: {
            id: true,
            nama: true,
          },
        },
        siswa: {
          select: {
            nis: true,
            user: {
              select: {
                namaLengkap: true,
              },
            },
          },
        },
        kelompok: {
          select: {
            namaKelompok: true,
            kelas: {
              select: {
                namaKelas: true,
                tahunAjaran: true,
              },
            },
          },
        },
        guru: {
          select: {
            user: {
              select: {
                namaLengkap: true,
              },
            },
          },
        },
      },
    });

    console.log('Setoran List:', setoranList);

    return NextResponse.json({
      success: true,
      message: 'Data setoran berhasil diambil',
      data: setoranList,
    });
  } catch (error) {
    console.error('[SUBMISSION_GET]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil data setoran',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the JSON data from the request
    const {
      kelompokId,
      siswaId,
      surahId,
      ayatMulai,
      ayatSelesai,
      jenisSetoran,
      statusSetoran,
      adab, // Include adab here
      catatan,
    } = await req.json();

    // Validate required fields
    if (
      !kelompokId ||
      !siswaId ||
      !surahId ||
      !ayatMulai ||
      !ayatSelesai ||
      !jenisSetoran ||
      !statusSetoran ||
      !adab // Ensure adab is provided
    ) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const guru = await prisma.guruProfile.findUnique({
      where: { userId: user.id },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, message: 'Profil guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const isGuruMembimbing = await prisma.guruKelompok.findFirst({
      where: {
        guruId: guru.id,
        kelompokId,
      },
    });

    if (!isGuruMembimbing) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak membimbing kelompok ini' },
        { status: 403 }
      );
    }

    const siswa = await prisma.siswaProfile.findFirst({
      where: {
        id: siswaId,
        kelompokId,
      },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak berada di kelompok ini' },
        { status: 400 }
      );
    }

    const setoranId = `SETORAN-${crypto.randomUUID()}`;

    const setoran = await prisma.setoran.create({
      data: {
        id: setoranId,
        siswaId,
        guruId: guru.id,
        kelompokId,
        tanggal: new Date(),
        surahId,
        ayatMulai,
        ayatSelesai,
        jenisSetoran,
        status: statusSetoran,
        adab,
        catatan,
      },
    });

    return NextResponse.json({ success: true, data: setoran });
  } catch (error) {
    console.error('[SUBMISSION_POST]', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyimpan setoran' },
      { status: 500 }
    );
  }
}
