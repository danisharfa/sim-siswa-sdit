// File: src/app/api/coordinator/student/available/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { StudentStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'coordinator') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const url = new URL(req.url);
    const classroomId = url.searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json(
        { success: false, message: 'Parameter classroomId wajib disediakan' },
        { status: 400 }
      );
    }

    const students = await prisma.studentProfile.findMany({
      where: {
        classroomId,
        status: StudentStatus.AKTIF,
        groupId: null,
      },
      orderBy: { nis: 'asc' },
      select: {
        id: true,
        nis: true,
        user: {
          select: { fullName: true },
        },
      },
    });

    const formatted = students.map((s) => ({
      id: s.id,
      nis: s.nis,
      fullName: s.user.fullName,
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil siswa dari kelas tersebut',
      data: formatted,
    });
  } catch (error) {
    console.error('[GET /coordinator/student/available]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data siswa' },
      { status: 500 }
    );
  }
}
