import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Group Id is required' },
        { status: 400 }
      );
    }

    const members = await prisma.studentProfile.findMany({
      where: {
        groupId: id,
      },
      orderBy: {
        nis: 'asc',
      },
      select: {
        id: true,
        nis: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const formattedMembers = members.map((m) => ({
      id: m.id,
      nis: m.nis,
      fullName: m.user?.fullName || 'Tidak diketahui',
    }));

    return NextResponse.json({
      success: true,
      message: 'Data anggota kelompok berhasil diambil',
      data: formattedMembers,
    });
  } catch (error) {
    console.error('Error get members:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data anggota kelompok' },
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
        { success: false, message: 'NIS dan id wajib diisi' },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.findUnique({ where: { nis } });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json(
        { success: false, message: 'Kelompok tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi: siswa harus berada di kelas yang sama dengan kelompok
    if (student.classroomId !== group.classroomId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Siswa harus berada di kelas yang sama dengan kelas kelompok ini',
        },
        { status: 400 }
      );
    }

    // Cek apakah siswa sudah tergabung dalam kelompok yang sama
    if (student.groupId === id) {
      return NextResponse.json(
        { success: false, message: 'Siswa sudah tergabung dalam kelompok ini' },
        { status: 409 }
      );
    }

    // Update siswa untuk bergabung ke kelompok
    await prisma.studentProfile.update({
      where: { id: student.id },
      data: { groupId: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil ditambahkan ke kelompok',
    });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;
    const { nis } = await req.json();

    if (!id || !nis) {
      return NextResponse.json(
        { success: false, message: 'ID dan NIS wajib diisi' },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.findUnique({ where: { nis } });

    if (!student || student.groupId !== id) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan di kelompok ini' },
        { status: 404 }
      );
    }

    await prisma.studentProfile.update({
      where: { id: student.id },
      data: { groupId: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil dikeluarkan dari kelompok',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
