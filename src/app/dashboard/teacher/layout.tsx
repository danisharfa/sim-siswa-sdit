import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/get-session';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user || session.user.role !== 'teacher') {
    return redirect('/login');
  }

  return <>{children}</>;
}
