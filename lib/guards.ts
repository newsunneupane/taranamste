// Server-only guard helpers. New model: isSuperAdmin + per-page {read,write}.
// Legacy helpers kept for compat where referenced but prefer requireRead/requireWrite.
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  canAccess,
  allowedRolesFor,
  isAdmin,
  type Role,
  canRead,
  canWrite,
  type PermissionsMap,
} from "@/lib/permission";

export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentRole(): Promise<Role | null> {
  const session = await getCurrentSession();
  return (session?.user?.role as Role) ?? null;
}

export async function getCurrentActor(): Promise<{ id: string; isSuperAdmin: boolean; permissions: PermissionsMap } | null> {
  const session = await getCurrentSession();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id as string,
    isSuperAdmin: !!(session.user as any).isSuperAdmin,
    permissions: ((session.user as any).permissions as PermissionsMap) || {},
  };
}

export async function requirePageAccess(path: string) {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/");
  const actor = {
    isSuperAdmin: !!(session.user as any).isSuperAdmin,
    permissions: ((session.user as any).permissions as PermissionsMap) || {},
  };
  if (!canRead(path, actor)) redirect("/");
  return { session, role: session.user.role as Role, actor };
}

export async function requireAuth() {
  const session = await getCurrentSession();
  return session;
}

export async function requireRole(...allowed: Role[]): Promise<Role | null> {
  const role = await getCurrentRole();
  if (!role || !allowed.includes(role)) return null;
  return role;
}

export async function requireRead(path: string): Promise<{ ok: true; session: any; actor: any } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };
  const actor = {
    isSuperAdmin: !!(session.user as any).isSuperAdmin,
    permissions: ((session.user as any).permissions as PermissionsMap) || {},
  };
  if (!canRead(path, actor)) return { ok: false, error: "Read access denied for " + path };
  return { ok: true, session, actor };
}

export async function requireWrite(path: string): Promise<{ ok: true; session: any; actor: any } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };
  const actor = {
    isSuperAdmin: !!(session.user as any).isSuperAdmin,
    permissions: ((session.user as any).permissions as PermissionsMap) || {},
  };
  if (!canWrite(path, actor)) return { ok: false, error: "Write access denied for " + path };
  return { ok: true, session, actor };
}

export async function isCurrentAdmin() {
  const actor = await getCurrentActor();
  return !!actor?.isSuperAdmin;
}

export function describeAccess(path: string) {
  const roles = allowedRolesFor(path);
  if (!roles) return "all signed-in users";
  return roles.join(", ");
}
