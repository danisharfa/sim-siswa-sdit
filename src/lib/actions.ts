'use server';

import { AddUserSchema } from '@/lib/validations/auth';
import { prisma } from '@/lib/prisma';
import { AuthError } from 'next-auth';
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';

function generateCustomId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export const addUserCredentials = async (prevState: unknown, formData: FormData) => {
  const validatedFields = AddUserSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, fullName, role } = validatedFields.data;
  const hashedPassword = await hash(username, 10);

  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        fullName,
        password: hashedPassword,
        role,
      },
    });

    if (role === Role.coordinator) {
      const coordinatorId = generateCustomId('COORDINATOR');
      try {
        await prisma.coordinatorProfile.create({
          data: {
            id: coordinatorId,
            userId: newUser.id,
            nip: username,
          },
        });
        console.log('Profil koordinator berhasil dibuat');
      } catch (error) {
        console.error('Gagal membuat profil koordinator:', error);
        return { success: false, message: 'Gagal membuat profil koordinator' };
      }
    }

    if (role === Role.teacher) {
      const teacherId = generateCustomId('GURU');
      try {
        await prisma.teacherProfile.create({
          data: {
            id: teacherId,
            userId: newUser.id,
            nip: username,
          },
        });
        console.log('Profil guru berhasil dibuat');
      } catch (error) {
        console.error('Gagal membuat profil guru:', error);
        return { success: false, message: 'Gagal membuat profil guru' };
      }
    }

    if (role === Role.student) {
      const studentId = generateCustomId('SISWA');
      try {
        await prisma.studentProfile.create({
          data: {
            id: studentId,
            userId: newUser.id,
            nis: username,
          },
        });
        console.log('Profil siswa berhasil dibuat');
      } catch (error) {
        console.error('Gagal membuat profil siswa:', error);
        return { success: false, message: 'Gagal membuat profil siswa' };
      }
    }

    return { success: true, message: 'User berhasil ditambah!' };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, message: error.message };
    }
  }
};
