import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const member = await prisma.familyMember.findUnique({
          where: { email: credentials.email },
          include: { family: true },
        });

        if (!member) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          member.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: member.id,
          email: member.email,
          name: member.name,
          isAdmin: member.isAdmin,
          familyId: member.familyId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.familyId = user.familyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.familyId = token.familyId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Extend session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
      familyId: string;
    };
  }

  interface User {
    id: string;
    isAdmin: boolean;
    familyId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isAdmin: boolean;
    familyId: string;
  }
}
