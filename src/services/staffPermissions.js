const operations = [
  "view_workspace",
  "process_referrals",
  "record_outcomes",
  "assign_staff",
  "view_reports",
]
export const roleLabels = { peso_staff: "PESO Staff", peso_admin: "PESO Admin" }
const permissions = {
  peso_staff: operations,
  peso_admin: [
    ...operations,
    "manage_staff",
    "manage_settings",
    "view_audit",
    "manage_reference",
    "manage_employers",
    "manage_vacancies",
  ],
}
// UX/prototype checks only. Future Laravel policies and authenticated identity are authoritative.
export const can = (actor, permission) =>
  !!actor?.active && !!permissions[actor.role]?.includes(permission)
export function requirePermission(actor, permission) {
  if (!can(actor, permission))
    throw new Error("This action is not available for this prototype role.")
}
