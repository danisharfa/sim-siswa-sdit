import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
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
      updateData.password = await hash(existingUser.username, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
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
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete user' }, { status: 500 });
  }
}
