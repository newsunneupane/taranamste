// ---------------------------------------------------------------------------
// Role & permission policy for the orphanage admin.
//
// Roles (from models/User.ts):
//   ADMIN, SAMITY, STAFF, CAREGIVER, MEDICAL_STAFF, TEACHER
//
// Tiers (chosen product model):
//   ADMIN   -> full access (everything incl. management)
//   WORK    -> SAMITY, STAFF   : day-to-day operations
//   LIMITED -> CAREGIVER, MEDICAL_STAFF, TEACHER : child-focused, read-mostly
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

// Tier grouping helpers
const WORK_ROLES: Role[] = [ROLES.SAMITY, ROLES.STAFF];
const LIMITED_ROLES: Role[] = [ROLES.CAREGIVER, ROLES.MEDICAL_STAFF, ROLES.TEACHER];

export function isAdmin(role?: string | null) {
  return role === ROLES.ADMIN;
}

export function isWorkRole(role?: string | null) {
  return WORK_ROLES.includes(role as Role);
}

export function isLimitedRole(role?: string | null) {
  return LIMITED_ROLES.includes(role as Role);
}

export function isKnownRole(role?: string | null): role is Role {
  return Object.values(ROLES).includes(role as Role);
}

// ---------------------------------------------------------------------------
// Page access. Each entry is a route pattern -> roles allowed to view it.
// Pattern rules:
//   exact path           e.g. "/children"
//   trailing "/:path*"   e.g. "/children/:path*" covers nested pages too
// ---------------------------------------------------------------------------

const ADMIN_ONLY: Role[] = [ROLES.ADMIN];
const ALL_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.SAMITY,
  ROLES.STAFF,
  ROLES.CAREGIVER,
  ROLES.MEDICAL_STAFF,
  ROLES.TEACHER,
];
const WORK_ROLES_ALLOWED: Role[] = [...ADMIN_ONLY, ...WORK_ROLES];
const LIMITED_ROLES_ALLOWED: Role[] = [...ADMIN_ONLY, ...WORK_ROLES, ...LIMITED_ROLES];

export const PAGE_ACCESS: Record<string, Role[]> = {
  "/": LIMITED_ROLES_ALLOWED,
  "/dashboard": LIMITED_ROLES_ALLOWED,

  "/children": LIMITED_ROLES_ALLOWED,
  "/children/:path*": LIMITED_ROLES_ALLOWED,

  "/my-finances": LIMITED_ROLES_ALLOWED,

  "/finance": WORK_ROLES_ALLOWED,
  "/inventory": WORK_ROLES_ALLOWED,
  "/guardians": WORK_ROLES_ALLOWED,

  // Management / admin-only
  "/approvals": ADMIN_ONLY,
  "/settlements": ADMIN_ONLY,
  "/staff": ADMIN_ONLY,
  "/staff/:path*": ADMIN_ONLY,
  "/accounts_headers": ADMIN_ONLY,
  "/usersmanagement": ADMIN_ONLY,
  "/payroll": ADMIN_ONLY,
  "/payment-categories": ADMIN_ONLY,
};

// Public / unauthenticated routes
export const PUBLIC_PATHS = ["/register", "/api/:path*"];

// ---------------------------------------------------------------------------
// Matching logic
// ---------------------------------------------------------------------------

function toSegments(path: string) {
  return path.split("/").filter(Boolean);
}

/**
 * Returns the allowed roles for a given request path, or null if the path is
 * not covered by the policy (no explicit rule).
 */
export function allowedRolesFor(path: string): Role[] | null {
  const segs = toSegments(path);

  // Exact match first
  if (PAGE_ACCESS[path]) return PAGE_ACCESS[path];

  // Pattern match: e.g. "/children/:path*" matches "/children/abc/def"
  for (const [pattern, roles] of Object.entries(PAGE_ACCESS)) {
    if (!pattern.endsWith("/:path*")) continue;
    const base = pattern.replace(/\/:path\*$/, "");
    if (path === base || path.startsWith(base + "/")) return roles;
  }

  return null;
}

/**
 * Whether a role is allowed to access a given path.
 */
export function canAccess(path: string, role?: string | null) {
  if (!role) return false;
  const roles = allowedRolesFor(path);
  if (!roles) return true; // unlisted routes are not restricted by policy
  return roles.includes(role as Role);
}

/**
 * Whether a path requires an authenticated session at all (i.e. is not public).
 */
export function isPublicPath(path: string) {
  for (const p of PUBLIC_PATHS) {
    if (p === "/api/:path*") {
      if (path === "/api" || path.startsWith("/api/")) return true;
    } else if (path === p || path.startsWith(p + "/")) {
      return true;
    }
  }
  return path === "/api" || path.startsWith("/api/") || path === "/register";
}
