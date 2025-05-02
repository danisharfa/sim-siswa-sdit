import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const classrooms = await prisma.classroom.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: classrooms });
  } catch (error) {
    console.error('Gagal mendapatkan daftar kelas:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mendapatkan daftar kelas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Body request tidak valid' },
        { status: 400 }
      );
    }

    const { name, academicYear } = body;

    if (!name || !academicYear) {
      return NextResponse.json(
        { success: false, message: 'Nama kelas dan tahun ajaran wajib diisi' },
        { status: 400 }
      );
    }

    const existingClass = await prisma.classroom.findFirst({
      where: { name, academicYear },
    });

    if (existingClass) {
      return NextResponse.json({ success: false, message: 'Kelas sudah ada' }, { status: 400 });
    }

    const classroomId = `KELAS-${crypto.randomUUID()}`;

    const classroom = await prisma.classroom.create({
      data: { id: classroomId, name, academicYear },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil membuat kelas',
      data: classroom,
    });
  } catch (error) {
    console.error('Gagal membuat kelas:', error);
    return NextResponse.json({ success: false, message: 'Gagal membuat kelas' }, { status: 500 });
  }
}
