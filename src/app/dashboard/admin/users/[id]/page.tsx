import { notFound } from 'next/navigation';
import { UserDetail } from '@/components/admin/user/user-detail';
import { prisma } from '@/lib/prisma';
import { BackButton } from '@/components/ui/back-button';

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
    ? 'student'
    : user.teacher
    ? 'teacher'
    : user.coordinator
    ? 'coordinator'
    : null;

  if (!role) return notFound();

  return (
    <div className="p-4">
      <BackButton href={`/dashboard/admin/users`} />
      <h1 className="text-2xl font-bold mb-4">
        {role === 'student'
          ? `Siswa - ${user.fullName}`
          : role === 'teacher'
          ? `Guru - ${user.fullName}`
          : `Koordinator - ${user.fullName}`}
      </h1>

      <UserDetail userId={id} role={role} />
    </div>
  );
}
