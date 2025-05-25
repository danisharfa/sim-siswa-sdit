import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID pengguna tidak valid' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        coordinator: true,
        teacher: true,
        student: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    let role: 'student' | 'teacher' | 'coordinator' | null = null;
    if (user.student) role = Role.student;
    else if (user.teacher) role = Role.teacher;
    else if (user.coordinator) role = Role.coordinator;

    return NextResponse.json({
      success: true,
      message: 'Detail user berhasil diambil',
      data: {
        ...user,
        role,
      },
    });
  } catch (error) {
    console.error('[USER_DETAIL_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data user' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    const {
      fullName,
      role,
      nis,
      nisn,
      nip,
      birthDate,
      birthPlace,
      gender,
      bloodType,
      address,
      phoneNumber,
      email,
    } = await req.json();

    await prisma.user.update({
      where: { id },
      data: { fullName },
    });

    const updateData = {
      birthDate,
      birthPlace,
      gender,
      bloodType,
      address,
      phoneNumber,
      email,
    };

    if (role === Role.coordinator) {
      await prisma.coordinatorProfile.update({
        where: { userId: id },
        data: { ...updateData, nip },
      });
    } else if (role === Role.teacher) {
      await prisma.teacherProfile.update({
        where: { userId: id },
        data: { ...updateData, nip },
      });
    } else if (role === Role.student) {
      await prisma.studentProfile.update({
        where: { userId: id },
        data: { ...updateData, nis, nisn },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        coordinator: true,
        teacher: true,
        student: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil diperbarui',
      data: updatedUser,
    });
  } catch (error) {
    console.error('[USER_DETAIL_PUT]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui user' },
      { status: 500 }
    );
  }
}
