export function canCreateCompany(user) {
  return ["employee", "employer"].includes(user?.role)
}
