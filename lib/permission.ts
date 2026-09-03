// ---------------------------------------------------------------------------
// Permission policy - per-page Read/Write matrix owned by SuperAdmin.
// SuperAdmin (isSuperAdmin=true) bypasses all checks.
// Other users have an explicit {read,write} flag per PAGE_KEY.
// write implies read.
// ---------------------------------------------------------------------------

export const ROLES = {
  ADMIN: "ADMIN",
  SAMITY: "SAMITY",
  STAFF: "STAFF",
  CAREGIVER: "CAREGIVER",
  MEDICAL_STAFF: "MEDICAL_STAFF",
  TEACHER: "TEACHER",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export function isAdmin(role?: string | null) {
  // legacy helper - now checks isSuperAdmin where possible; keep for compat
  return role === ROLES.ADMIN;
}
export function isWorkRole(role?: string | null) {
  return role === ROLES.SAMITY || role === ROLES.STAFF;
}
export function isLimitedRole(role?: string | null) {
  return role === ROLES.CAREGIVER || role === ROLES.MEDICAL_STAFF || role === ROLES.TEACHER;
}
export function isKnownRole(role?: string | null): role is Role {
  return Object.values(ROLES).includes(role as Role);
}

// Canonical page keys that appear as checkboxes in SuperAdmin management.
// Keep route-shaped so proxy + guards can match with canRead/canWrite.
export const PAGE_KEYS = [
  "/",
  "/dashboard",
  "/children",
  "/children/:path*",
  "/finance",
  "/inventory",
  "/guardians",
  "/approvals",
  "/settlements",
  "/staff",
  "/staff/:path*",
  "/accounts_headers",
  "/usersmanagement",
  "/payroll",
  "/payment-categories",
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const PAGE_LABELS: Record<string, string> = {
  "/": "Overview ( / )",
  "/dashboard": "Dashboard",
  "/children": "Children",
  "/children/:path*": "Children — profiles / docs / images",
  "/finance": "Finance",
  "/inventory": "Inventory",
  "/guardians": "Guardians",
  "/approvals": "Approvals",
  "/settlements": "Settlements",
  "/staff": "Staff",
  "/staff/:path*": "Staff — detail",
  "/accounts_headers": "Chart of Accounts",
  "/usersmanagement": "User Management",
  "/payroll": "Payroll",
  "/payment-categories": "Payment Categories",
};

export const PAGE_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Core", keys: ["/", "/dashboard", "/children", "/children/:path*"] },
  { label: "Operations", keys: ["/finance", "/inventory", "/guardians"] },
  { label: "Administration", keys: ["/approvals", "/settlements", "/staff", "/staff/:path*", "/payroll", "/payment-categories", "/accounts_headers", "/usersmanagement"] },
];

export type PagePermission = { read: boolean; write: boolean };
export type PermissionsMap = Record<string, PagePermission>;

export const PUBLIC_PATHS = ["/api/:path*"];

function toSegments(path: string) {
  return path.split("/").filter(Boolean);
}

// legacy PAGE_ACCESS kept for migration display only
const ADMIN_ONLY: Role[] = [ROLES.ADMIN];
const ALL_ROLES: Role[] = [ROLES.ADMIN, ROLES.SAMITY, ROLES.STAFF, ROLES.CAREGIVER, ROLES.MEDICAL_STAFF, ROLES.TEACHER];
const WORK_ROLES_ALLOWED: Role[] = [...ADMIN_ONLY, ROLES.SAMITY, ROLES.STAFF];
const LIMITED_ROLES_ALLOWED: Role[] = [...ADMIN_ONLY, ROLES.SAMITY, ROLES.STAFF, ROLES.CAREGIVER, ROLES.MEDICAL_STAFF, ROLES.TEACHER];
export const PAGE_ACCESS: Record<string, Role[]> = {
  "/": LIMITED_ROLES_ALLOWED,
  "/dashboard": LIMITED_ROLES_ALLOWED,
  "/children": LIMITED_ROLES_ALLOWED,
  "/children/:path*": LIMITED_ROLES_ALLOWED,
  "/finance": WORK_ROLES_ALLOWED,
  "/inventory": WORK_ROLES_ALLOWED,
  "/guardians": WORK_ROLES_ALLOWED,
  "/approvals": ADMIN_ONLY,
  "/settlements": ADMIN_ONLY,
  "/staff": ADMIN_ONLY,
  "/staff/:path*": ADMIN_ONLY,
  "/accounts_headers": ADMIN_ONLY,
  "/usersmanagement": ADMIN_ONLY,
  "/payroll": ADMIN_ONLY,
  "/payment-categories": ADMIN_ONLY,
};

export function allowedRolesFor(path: string): Role[] | null {
  if (PAGE_ACCESS[path]) return PAGE_ACCESS[path];
  for (const [pattern, roles] of Object.entries(PAGE_ACCESS)) {
    if (!pattern.endsWith("/:path*")) continue;
    const base = pattern.replace(/\/:path\*$/, "");
    if (path === base || path.startsWith(base + "/")) return roles;
  }
  return null;
}

// legacy canAccess kept for compat - new code should use canRead
export function canAccess(path: string, role?: string | null) {
  if (!role) return false;
  const roles = allowedRolesFor(path);
  if (!roles) return true;
  return roles.includes(role as Role);
}

// ---------------------------------------------------------------------------
// New permission helpers - preferred
// ---------------------------------------------------------------------------

function matchPageKey(path: string): string | null {
  if ((PAGE_KEYS as readonly string[]).includes(path)) return path;
  for (const k of PAGE_KEYS) {
    if (!k.endsWith("/:path*")) continue;
    const base = k.replace(/\/:path\*$/, "");
    if (path === base || path.startsWith(base + "/")) return k;
  }
  // non-canonical page not in matrix: allow if no rule covers it
  // Check if any PAGE_KEYS pattern would match this path's prefix
  // For pages like /children/123/images -> matches /children/:path*
  return null;
}

function normalizePermissions(perms: any): PermissionsMap {
  if (!perms || typeof perms !== "object") return {};
  return perms as PermissionsMap;
}

export function canRead(path: string, actor: { isSuperAdmin?: boolean; permissions?: PermissionsMap } | null | undefined): boolean {
  if (!actor) return false;
  if (actor.isSuperAdmin) return true;
  if (path === "/" || path === "/dashboard") return true;
  const perms = normalizePermissions(actor.permissions);
  const key = matchPageKey(path);
  if (!key) return true;
  const p = perms[key];
  if (!p) return false;
  return !!p.read || !!p.write;
}

export function canWrite(path: string, actor: { isSuperAdmin?: boolean; permissions?: PermissionsMap } | null | undefined): boolean {
  if (!actor) return false;
  if (actor.isSuperAdmin) return true;
  const perms = normalizePermissions(actor.permissions);
  const key = matchPageKey(path);
  if (!key) return false;
  const p = perms[key];
  if (!p) return false;
  return !!p.write;
}

export function isPublicPath(path: string) {
  for (const p of PUBLIC_PATHS) {
    if (p === "/api/:path*") {
      if (path === "/api" || path.startsWith("/api/")) return true;
    } else if (path === p || path.startsWith(p + "/")) {
      return true;
    }
  }
  return path === "/api" || path.startsWith("/api/");
}

export function defaultPermissionsForRole(role: string): PermissionsMap {
  // migration helper: map old role to sensible defaults
  if (role === ROLES.ADMIN) return {};
  const readAll: PermissionsMap = {};
  const opsReadWrite = ["/finance", "/inventory", "/guardians"];
  const childrenOnly = ["/", "/dashboard", "/children", "/children/:path*"];
  if (role === ROLES.SAMITY || role === ROLES.STAFF) {
    for (const k of [...childrenOnly, ...opsReadWrite]) readAll[k] = { read: true, write: k !== "/" && k !== "/dashboard" ? true : false };
    // staff can read but not write approvals etc
    for (const k of ["/approvals", "/settlements", "/staff", "/staff/:path*", "/accounts_headers", "/usersmanagement", "/payroll", "/payment-categories"]) readAll[k] = { read: false, write: false };
  } else {
    for (const k of childrenOnly) readAll[k] = { read: true, write: false };
    for (const k of PAGE_KEYS) if (!readAll[k]) readAll[k] = { read: false, write: false };
  }
  return readAll;
}
