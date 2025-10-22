import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const classrooms = await prisma.classroom.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    const formattedData = classrooms.map((c) => ({
      ...c,
      studentCount: c._count.students,
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar kelas',
      data: formattedData,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar kelas:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar kelas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Body request tidak valid' },
        { status: 400 }
      );
    }

    const { name, academicYear, semester } = body;

    if (!name || !academicYear || !semester) {
      return NextResponse.json(
        { success: false, message: 'Harap lengkapi semua data kelas' },
        { status: 400 }
      );
    }

    const existingClass = await prisma.classroom.findFirst({
      where: { name, academicYear, semester, isActive: true },
    });

    if (existingClass) {
      return NextResponse.json({ success: false, message: 'Kelas sudah ada' }, { status: 400 });
    }

    const classroomId = `KELAS-${crypto.randomUUID()}`;

    const classroom = await prisma.classroom.create({
      data: { id: classroomId, name, academicYear, semester, isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil ditambahkan',
      data: classroom,
    });
  } catch (error) {
    console.error('Gagal menambah kelas:', error);
    return NextResponse.json({ success: false, message: 'Gagal menambah kelas' }, { status: 500 });
  }
}
