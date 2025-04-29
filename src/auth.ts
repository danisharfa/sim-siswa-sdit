import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Credentials from 'next-auth/providers/credentials';
import { LogInSchema } from '@/lib/zod';
import { compare } from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60,
    updateAge: 5 * 60,
  },

  pages: {
    signIn: '/login',
  },

  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        const validatedFields = LogInSchema.safeParse(credentials);

        if (!validatedFields.success) {
          console.log('Validation failed', validatedFields.error.flatten());
          return null;
        }

        const { username, password } = validatedFields.data;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
          console.log('No user found');
          return null;
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
          console.log('Password mismatch');
          return null;
        }

        return user;
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.username = user.username;
        token.namaLengkap = user.namaLengkap;
      }
      return token;
    },

    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      session.user.role = token.role;
      session.user.username = token.username;
      session.user.namaLengkap = token.namaLengkap;
      return session;
    },
  },
});

// import { cookies } from 'next/headers';
// import { jwtVerify } from 'jose';

// const secret = process.env.JWT_SECRET;
// if (!secret) throw new Error('Missing JWT_SECRET');

// const secretKey = new TextEncoder().encode(secret);

// export async function getUser() {
//   const token = (await cookies()).get('token')?.value;
//   if (!token) return null;

//   try {
//     const { payload } = await jwtVerify(token, secretKey);
//     return {
//       id: payload.id as string,
//       username: payload.username as string,
//       namaLengkap: payload.namaLengkap as string,
//       role: payload.role as string,
//     };
//   } catch (error) {
//     console.error('[AUTH_ERROR]: Invalid token', error);
//     return null;
//   }
// }
