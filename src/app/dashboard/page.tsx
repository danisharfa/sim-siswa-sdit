import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/get-session';

export default async function DashboardRedirect() {
  const session = await getSession();

  if (!session) return redirect('/login');

  const { role } = session.user;

  if (role === 'admin') return redirect('/dashboard/admin');
  if (role === 'teacher') return redirect('/dashboard/teacher');
  if (role === 'student') return redirect('/dashboard/student');

  return redirect('/dashboard');
}
