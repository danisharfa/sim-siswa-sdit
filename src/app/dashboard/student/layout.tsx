import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UserContextProvider } from '@/lib/context/user-context';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'student') {
    return redirect('/login');
  }

  return <UserContextProvider user={session.user}>{children}</UserContextProvider>;
}
