import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
      namaLengkap: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    username: string;
    namaLengkap: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    sub: string;
    role: string;
    username: string;
    namaLengkap: string;
  }
}
