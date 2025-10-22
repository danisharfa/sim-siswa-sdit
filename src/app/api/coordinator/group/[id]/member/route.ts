import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;

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
        userId: true,
        nis: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const formattedMembers = members.map((m) => ({
      id: m.userId,
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
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;

    const { nisList } = await req.json();

    if (!Array.isArray(nisList) || nisList.length === 0 || !id) {
      return NextResponse.json(
        { success: false, message: 'Daftar NIS dan ID kelompok wajib disediakan' },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id },
      select: { classroomId: true },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, message: 'Kelompok tidak ditemukan' },
        { status: 404 }
      );
    }

    const students = await prisma.studentProfile.findMany({
      where: {
        nis: { in: nisList },
        classroomId: group.classroomId,
        groupId: null,
      },
    });

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada siswa valid untuk ditambahkan' },
        { status: 400 }
      );
    }

    const updatePromises = students.map((student) =>
      prisma.studentProfile.update({
        where: { userId: student.userId },
        data: { groupId: id },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `${students.length} siswa berhasil ditambahkan ke kelompok`,
    });
  } catch (error) {
    console.error('Error adding members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;

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
      where: { userId: student.userId },
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
