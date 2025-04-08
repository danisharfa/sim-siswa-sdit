import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    const { username, namaLengkap, resetPassword } = await req.json();

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: {
      username?: string;
      namaLengkap?: string;
      password?: string;
    } = {};

    if (username) updateData.username = username;
    if (namaLengkap) updateData.namaLengkap = namaLengkap;
    if (resetPassword) {
      if (!existingUser.username) {
        return NextResponse.json(
          { error: 'Invalid username for password reset' },
          { status: 400 }
        );
      }
      updateData.password = await argon2.hash(existingUser.username);
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: 'User updated successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
