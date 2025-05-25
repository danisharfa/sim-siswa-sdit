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

    const { username, fullName, resetPassword } = await req.json();

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updateData: {
      username?: string;
      fullName?: string;
      password?: string;
    } = {};

    if (username) updateData.username = username;
    if (fullName) updateData.fullName = fullName;

    if (resetPassword) {
      if (!existingUser.username) {
        return NextResponse.json(
          { success: false, message: 'Invalid username for password reset' },
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
      message: resetPassword ? 'Password berhasil direset' : 'User berhasil diupdate',
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

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete user' }, { status: 500 });
  }
}
