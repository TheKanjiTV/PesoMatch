# AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO) — Replacement Workspace

The October 10 revision replaces the prior social/job-board-inspired workspace. Its top toolbar, activity feed, docked conversations, and frontend-only staff preview are retired from the active router.

The current design and workflow authority is PRODUCT.md, docs/DESIGN.md, and docs/REQUIREMENTS.md. Active service screens live in src/platform/. Authentication and profiling keep their existing Laravel validation/session contracts. New employment and training records persist in Laravel.

User-supplied posters and earlier demo modules remain on disk for reference, but the active public portal and dashboard do not use them as an employment timeline or claim their activity as live platform data.
