'use server';

import { AddUserSchema, LogInSchema } from '@/lib/zod';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export const addUserCredentials = async (prevState: unknown, formData: FormData) => {
  const validatedFields = AddUserSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, namaLengkap, role } = validatedFields.data;
  const hashedPassword = await hash(username, 10);

  try {
    await prisma.user.create({
      data: {
        username,
        namaLengkap,
        password: hashedPassword,
        role,
      },
    });

    return { success: true, message: 'User berhasil ditambah!' };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, message: error.message };
    }
  }
};

export const logInCredentials = async (prevState: unknown, formData: FormData) => {
  const validatedFields = LogInSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, password } = validatedFields.data;

  const result = await signIn('credentials', {
    username,
    password,
    redirect: false,
  });

  console.log('SIGNIN RESULT:', result);

  if (result?.error) {
    return { success: false, message: 'Gagal login' };
  }

  return {
    success: true,
    message: 'Berhasil login',
  };
};
