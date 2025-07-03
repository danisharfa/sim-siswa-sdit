import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function DashboardRedirect() {
  const session = await auth();

  if (!session) return redirect('/');

  const { role } = session.user;

  switch (role) {
    case Role.admin:
      return redirect('/dashboard/admin');
    case Role.coordinator:
      return redirect('/dashboard/coordinator');
    case Role.teacher:
      return redirect('/dashboard/teacher');
    case Role.student:
      return redirect('/dashboard/student');
    default:
      return redirect('/dashboard');
  }
}
