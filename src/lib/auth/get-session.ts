import { auth } from '@/auth';

export async function getSession() {
  try {
    const session = await auth();
    
    // Log untuk debugging
    // console.log('Session retrieved:', session?.user?.username);
    
    if (session?.user && !session.user.role) {
      throw new Error('User role not found');
    }
    
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}
