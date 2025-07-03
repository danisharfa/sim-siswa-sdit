import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import Credentials from 'next-auth/providers/credentials';
import { LogInSchema } from '@/lib/validations/auth';
import { compare } from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60,
    updateAge: 30 * 60,
  },

  pages: {
    signIn: '/',
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

        // console.log('AUTHORIZATION START');
        // console.log('Authorize called with:', credentials);
        // console.log('Validated fields:', validatedFields);
        // console.log('User from DB:', user);
        // console.log('Password match:', passwordMatch);

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
        token.fullName = user.fullName;
      }
      return token;
    },

    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      session.user.role = token.role;
      session.user.username = token.username;
      session.user.fullName = token.fullName;
      return session;
    },
  },
});
