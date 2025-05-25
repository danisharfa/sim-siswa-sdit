import { notFound } from 'next/navigation';
import { UserDetail } from '@/components/admin/user/user-detail';
import { prisma } from '@/lib/prisma';
import { BackButton } from '@/components/ui/back-button';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export default async function UserPage({ params }: { params: Params }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      coordinator: true,
      teacher: true,
      student: true,
    },
  });

  if (!user) return notFound();

  const role = user.student
    ? Role.student
    : user.teacher
    ? Role.teacher
    : user.coordinator
    ? Role.coordinator
    : null;

  if (!role) return notFound();

  return (
    <div className="p-4">
      <BackButton href={`/dashboard/admin/users`} />
      <h1 className="text-2xl font-bold mb-4">
        {role === Role.student
          ? `Siswa - ${user.fullName}`
          : role === Role.teacher
          ? `Guru - ${user.fullName}`
          : `Koordinator - ${user.fullName}`}
      </h1>

      <UserDetail userId={id} role={role} />
    </div>
  );
}
