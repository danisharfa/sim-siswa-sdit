import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, oldPassword, newPassword } = await req.json();

    // Validasi input tidak boleh kosong
    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ambil data user dari database
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verifikasi password lama menggunakan argon2.verify
    const isPasswordValid = await argon2.verify(user.password, oldPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect old password' },
        { status: 401 }
      );
    }

    // Cek apakah password baru sama dengan password lama
    if (oldPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password cannot be the same as the old password' },
        { status: 400 }
      );
    }

    // Validasi panjang password baru
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Hash password baru
    const hashedPassword = await argon2.hash(newPassword);

    // Update password di database
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(), // Perbarui updatedAt saat password diubah
      },
    });

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error changing password:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
