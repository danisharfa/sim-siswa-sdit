import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.academicSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      return NextResponse.json(
        { success: false, message: 'Pengaturan belum tersedia' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error('Gagal mengambil AcademicSetting:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil AcademicSetting' },
      { status: 500 }
    );
  }
}
