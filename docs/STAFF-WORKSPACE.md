# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Staff & Partner Workspaces

## Current source facilitation and removal

PESO Bansud staff receive source-listed vacancy referrals and training requests in the existing queues. Record current employer contact/application instructions before referring a source vacancy. For registry training, create a verified local intake on the source program detail, then select it when confirming the pending enrollment. Capacity and source/intake linkage are enforced by Laravel. Delete controls are permission-scoped, require a five-second server-issued confirmation and preserve linked history; account erasure additionally requires administrator password confirmation. See [November 7 workflow](WORKSPACE-UPDATE-2026-11-07.md).

## Operational workflow

PESO/admin: inspect registry, maintain vacancies/training, review requests, coordinate referral/interview/offer, verify placement, schedule follow-up, monitor outcomes and coordinate support cases/events.

Employer: own vacancies and PESO-referred candidates only. Training provider: own programs and enrollment records only. Both partner roles submit catalog records for PESO publication review. Administrators manage existing account roles and audit records. No public role selection.

## Storage and backend boundary

The active staff workspace is backed by Laravel, not a browser demo. Role gates exist in both navigation and the backend, with backend authorization authoritative. Every domain status mutation records actor, action, entity, changes and timestamp.

Provision the initial admin with peso:access on an existing registered account. Never ship default privileged credentials. The last admin cannot delete their account or be demoted through the local command; the UI prevents self-role changes.

## Checks

PHPUnit verifies role/ownership boundaries. Playwright visits staff, employer, provider and admin routes, and checks forbidden UI/API access. See VERIFICATION.md.
