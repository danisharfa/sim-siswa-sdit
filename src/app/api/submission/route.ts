import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth'; // Assumed to get the logged-in user
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Get the current user
    const user = await getUser();

    // Ensure the user is authenticated and has the 'teacher' role
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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
        { success: false, error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Retrieve the teacher profile
    const guru = await prisma.guruProfile.findUnique({
      where: { userId: user.id },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Profil guru tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if the teacher is assigned to the group
    const isGuruMembimbing = await prisma.guruKelompok.findFirst({
      where: {
        guruId: guru.id,
        kelompokId,
      },
    });

    if (!isGuruMembimbing) {
      return NextResponse.json(
        { success: false, error: 'Guru tidak membimbing kelompok ini' },
        { status: 403 }
      );
    }

    // Check if the student is in the specified group
    const siswa = await prisma.siswaProfile.findFirst({
      where: {
        id: siswaId,
        kelompokId,
      },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa tidak berada di kelompok ini' },
        { status: 400 }
      );
    }

    const setoranId = `SETORAN-${crypto.randomUUID()}`;

    // Save the submission data, including adab
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
        adab, // Store adab value
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
