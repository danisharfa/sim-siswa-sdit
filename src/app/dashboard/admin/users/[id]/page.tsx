import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDetail } from '@/components/admin/user/user-detail';
import { prisma } from '@/lib/prisma';

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

  const displayName = user.fullName;
  const roleLabel = role === 'student' ? 'Siswa' : role === 'teacher' ? 'Guru' : 'Koordinator';

  return (
    <div className="p-4">
      <Link href="/dashboard/admin/users">
        <Button variant="ghost">
          <ArrowLeft />
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-4">
        {roleLabel} - {displayName}
      </h1>

      <UserDetail userId={id} />
    </div>
  );
}
