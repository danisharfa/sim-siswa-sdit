import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardRedirect() {
  const session = await auth();

  if (!session) return redirect('/login');

  const { role } = session.user;

  // if (role === 'admin') return redirect('/dashboard/admin');
  // if (role === 'coordinator') return redirect('/dashboard/coordinator');
  // if (role === 'teacher') return redirect('/dashboard/teacher');
  // if (role === 'student') return redirect('/dashboard/student');

  // return redirect('/dashboard');

  switch (role) {
    case 'admin':
      return redirect('/dashboard/admin');
    case 'coordinator':
      return redirect('/dashboard/coordinator');
    case 'teacher':
      return redirect('/dashboard/teacher');
    case 'student':
      return redirect('/dashboard/student');
    default:
      return redirect('/dashboard');
  }
}
