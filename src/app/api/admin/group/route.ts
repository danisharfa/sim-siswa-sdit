import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        classroom: {
          select: {
            name: true,
            academicYear: true,
          },
        },
        teacherGroup: {
          select: {
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
        },
      },
    });

    const formattedGroups = groups.map((g) => ({
      groupId: g.id,
      groupName: g.name,
      classroomName: g.classroom.name,
      classroomAcademicYear: g.classroom.academicYear,
      nip: g.teacherGroup.map((tg) => tg.teacher.nip),
      teacherName: g.teacherGroup.map((tg) => tg.teacher.user.fullName),
    }));

    return NextResponse.json({
      success: true,
      message: 'Data kelompok berhasil diambil',
      data: formattedGroups,
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
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Body request tidak valid' },
        { status: 400 }
      );
    }

    const { groupName, classroomName, classroomAcademicYear, nip } = body;

    if (!groupName || !classroomName || !classroomAcademicYear || !nip) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findUnique({
      where: {
        name_academicYear: {
          name: classroomName,
          academicYear: classroomAcademicYear,
        },
      },
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
      where: { nip },
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
          message: 'Guru dengan NIP tersebut tidak ditemukan',
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
      },
    });

    await prisma.teacherGroup.create({
      data: {
        teacherId: teacher.id,
        groupId: newGroup.id,
      },
    });

    const formattedGroup = {
      groupId: newGroup.id,
      groupName: newGroup.name,
      classroomName: classroom.name,
      classroomAcademicYear: classroom.academicYear,
      nip: teacher.nip,
      teacherName: teacher.user.fullName,
    };

    return NextResponse.json({
      success: true,
      message: 'Kelompok berhasil dibuat',
      data: formattedGroup,
    });
  } catch (error) {
    console.error('Gagal membuat kelompok:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat kelompok, silakan coba lagi.' },
      { status: 500 }
    );
  }
}
