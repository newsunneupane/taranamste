// Server-only guard helpers. Import these from server components ("use server"
// files and Server Components) to enforce the role policy.
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  canAccess,
  allowedRolesFor,
  isAdmin,
  type Role,
} from "@/lib/permission";

/**
 * Returns the current user's roles carried in the session (id, email, role).
 * Returns null when there is no authenticated session.
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * Returns the current user's role, or null if not logged in.
 */
export async function getCurrentRole(): Promise<Role | null> {
  const session = await getCurrentSession();
  return (session?.user?.role as Role) ?? null;
}

/**
 * Guard for pages (Server Components). Redirects unauthenticated users to the
 * login route and non-allowed roles to the dashboard.
 */
export async function requirePageAccess(path: string) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    redirect("/");
  }
  const role = session.user.role as Role;
  if (!canAccess(path, role)) {
    redirect("/");
  }
  return { session, role };
}

/**
 * Guard for server actions requiring an authenticated session.
 * Returns the session or null (caller decides how to handle it).
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  return session;
}

/**
 * Guard for server actions that must only be performed by a specific role or
 * set of roles. Returns the role, or null if the user is not allowed.
 */
export async function requireRole(...allowed: Role[]): Promise<Role | null> {
  const role = await getCurrentRole();
  if (!role || !allowed.includes(role)) return null;
  return role;
}

/**
 * Convenience: true if the current user is an ADMIN.
 */
export async function isCurrentAdmin() {
  const role = await getCurrentRole();
  return isAdmin(role);
}

/**
 * Human-readable list of roles allowed on a path (for error messages).
 */
export function describeAccess(path: string) {
  const roles = allowedRolesFor(path);
  if (!roles) return "all signed-in users";
  return roles.join(", ");
}
