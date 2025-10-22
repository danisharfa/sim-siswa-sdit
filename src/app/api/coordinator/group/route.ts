import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const data = await prisma.group.findMany({
      where: {
        classroom: {
          isActive: true,
        },
      },
      orderBy: [{ classroom: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        classroom: {
          select: {
            name: true,
            academicYear: true,
            semester: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
        teacher: {
          select: {
            nip: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    const formattedData = data.map((g) => ({
      groupId: g.id,
      groupName: g.name,
      classroomName: g.classroom.name,
      classroomAcademicYear: g.classroom.academicYear,
      classroomSemester: g.classroom.semester,
      studentCount: g._count.students,
      nip: g.teacher?.nip || '-',
      teacherName: g.teacher?.user.fullName || '-',
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data kelompok',
      data: formattedData,
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
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Body request tidak valid' },
        { status: 400 }
      );
    }

    const { groupName, classroomId, teacherId } = body;

    if (!groupName || !classroomId || !teacherId) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      return NextResponse.json(
        { success: false, message: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    const existingGroup = await prisma.group.findFirst({
      where: {
        name: groupName,
        classroomId: classroom.id,
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        { success: false, message: 'Kelompok sudah ada di kelas ini' },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: teacherId },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          message: 'Guru tidak ditemukan',
        },
        { status: 404 }
      );
    }

    const kelompokId = `KELOMPOK-${crypto.randomUUID()}`;

    const newGroup = await prisma.group.create({
      data: {
        id: kelompokId,
        name: groupName,
        classroomId: classroom.id,
        teacherId: teacherId,
      },
    });

    const formattedGroup = {
      groupId: newGroup.id,
      groupName: newGroup.name,
      classroomName: classroom.name,
      classroomAcademicYear: classroom.academicYear,
      classroomSemester: classroom.semester,
      nip: teacher.nip,
      teacherName: teacher.user.fullName,
    };

    return NextResponse.json({
      success: true,
      message: 'Berhasil membuat kelompok',
      data: formattedGroup,
    });
  } catch (error) {
    console.error('Gagal membuat kelompok:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat kelompok' },
      { status: 500 }
    );
  }
}
