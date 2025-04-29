import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function requireRole(role: string | string[]) {
  const session = await auth();

  if (!session?.user) {
    return redirect('/login');
  }

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(session.user.role)) {
    return redirect('/dashboard');
  }

  return session.user;
}
