import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const id = params.id;

    const { username, resetPassword } = await req.json();

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updateData: {
      username?: string;
      password?: string;
    } = {};

    if (username) {
      // Check if username already exists (excluding current user)
      const existingUsername = await prisma.user.findFirst({
        where: {
          username,
          id: { not: id },
        },
      });

      if (existingUsername) {
        return NextResponse.json(
          { success: false, message: 'Username sudah digunakan' },
          { status: 400 }
        );
      }

      updateData.username = username;
    }

    if (resetPassword) {
      if (!existingUser.username) {
        return NextResponse.json(
          { success: false, message: 'Nama pengguna tidak valid untuk reset password' },
          { status: 400 }
        );
      }

      const newPassword = await hash(existingUser.username, 10);
      updateData.password = newPassword;
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: resetPassword ? 'Password berhasil direset' : 'Username berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const id = params.id;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: 'Pengguna gagal dihapus' },
      { status: 500 }
    );
  }
}
