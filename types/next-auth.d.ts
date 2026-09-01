import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: string;
      isSuperAdmin?: boolean;
      permissions?: Record<string, { read: boolean; write: boolean }>;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    isSuperAdmin?: boolean;
    permissions?: Record<string, { read: boolean; write: boolean }>;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    role?: string;
    id?: string;
    isSuperAdmin?: boolean;
    permissions?: Record<string, { read: boolean; write: boolean }>;
  }
}