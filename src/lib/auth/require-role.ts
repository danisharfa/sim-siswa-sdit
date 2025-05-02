import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function requireRole(allowedRoles: string | string[]) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.user.role)) {
    redirect('/dashboard');
  }

  return session.user;
}
