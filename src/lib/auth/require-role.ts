import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function requireRole(allowedRoles: string | string[]) {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.user.role)) {
    redirect('/dashboard');
  }

  return session.user;
}

export async function requireStudentRole() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  if (session.user.role !== Role.student) {
    redirect('/dashboard');
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { nis: true },
  });

  return {
    ...session.user,
    profile: studentProfile,
  };
}

export async function requireTeacherRole() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  if (session.user.role !== Role.teacher) {
    redirect('/dashboard');
  }

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { nip: true },
  });

  return {
    ...session.user,
    profile: teacherProfile,
  };
}

export async function requireCoordinatorRole() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  if (session.user.role !== Role.coordinator) {
    redirect('/dashboard');
  }

  const coordinatorProfile = await prisma.coordinatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { nip: true },
  });

  return {
    ...session.user,
    profile: coordinatorProfile,
  };
}
