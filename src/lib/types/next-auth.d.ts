import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      fullName: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    username: string;
    fullName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    username: string;
    fullName: string;
  }
}
