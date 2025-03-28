import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default async function DashboardRedirect() {
  const user = await getUser();

  if (!user) {
    return redirect('/login');
  }

  if (user.role === 'admin') return redirect('/dashboard/admin');
  if (user.role === 'teacher') return redirect('/dashboard/teacher');
  return redirect('/dashboard/student');
}
