import { auth } from '@/auth';
import { Session } from 'next-auth';

let sessionCache: Session | null = null;

export async function getSession() {
  if (sessionCache) {
    return sessionCache;
  }

  const session = await auth();
  sessionCache = session;
  return session;
}
