# PesoMatch — Production Deployment Checklist

**Scope update (13 October 2026):** The user chose local Laragon first. Local database least privilege is configured and verified; see [LOCAL-REFINEMENTS.md](LOCAL-REFINEMENTS.md). This checklist applies to a later public deployment.

This is preparation for a later HTTPS deployment. The security revision enforces tested headers in the local production preview and Laravel API, and generates `dist/security-headers.conf` for the build. It does not provision public HTTPS or publish the system. See SECURITY-AUDIT.md and PRIVACY-ACCESSIBILITY-AUDIT.md for outstanding release requirements.

## Application and assets

Local preview now retains earlier hashed chunks and returns genuine asset 404s; current PWA release hashing excludes retained files. See [CHUNK-RECOVERY.md](CHUNK-RECOVERY.md). Stage public releases separately and retain prior hashed chunks during rollout; do not clean the directory serving open tabs.

- Serve the Vite production build through an HTTPS web server/CDN. Vite preview is a local verification server, not the public production server.
- Route /api and /sanctum to Laravel under the same origin. Preserve Sanctum session/CSRF behavior and the assigned-role authorization checks.
- Configure the real application origin, trusted stateful domains, secure/HTTP-only cookies, database credentials and APP_DEBUG=false. Keep environment files, backups, uploads and private résumé storage outside the public document root.
- Enable compressed JS/CSS responses. Cache content-hashed assets immutably; revalidate index.html, the manifest and sw.js so deployments can be discovered. Retain older hashed files for open tabs while a release rolls over.
- Revalidate or disable intermediary/browser storage of private API responses. The service worker must continue excluding /api, /sanctum, personal records, documents and all mutations.
- Use the supported production PHP runtime with OPcache and the application's appropriate Laravel configuration/route caching. Measure database/query behavior under realistic concurrency; Laravel's local development server is not a concurrency benchmark.

## Headers to validate in staging

| Header | Deployment consideration |
| --- | --- |
| Content-Security-Policy | Deploy the build-specific generated policy from `dist/security-headers.conf`; its script hash matches the inline appearance bootstrap. Copy the include outside the public root and use it for the SPA locations. The API sends its own stricter JSON policy. `style-src 'unsafe-inline'` remains necessary for existing React/Three styling; scripts do not permit unsafe-inline or unsafe-eval. Re-test on staging if adding origins, SDKs or transforms. |
| Strict-Transport-Security | Enable only after HTTPS works consistently. Review includeSubDomains/preload separately before committing all subdomains. |
| Cross-Origin-Opener-Policy | Assess same-origin against actual external login/link/download behavior before enforcement. |
| frame-ancestors / X-Frame-Options | Restrict embedding according to the deployment's intended integration model. |
| Referrer-Policy | Evaluate strict-origin-when-cross-origin for public and authenticated navigation. |
| X-Content-Type-Options | Set nosniff with correct JS, CSS, fonts, PDF and download MIME types. |
| Trusted Types | Investigate report-only violations and third-party compatibility before requiring trusted types for scripts. |

## Acceptance before release

Repeat authenticated mobile Lighthouse with a dedicated fixture and production compression/cache configuration. Confirm private routes remain noindex; increasing their SEO score is not a release objective. Verify sign-in/register, saved onboarding, role boundaries, catalog management, referral/placement/outcome flow, private PDF handling, mobile navigation, theme/text settings, tutorial replay, motion/reduced motion, accessibility and PWA update/offline behavior. Test actual supported Android/iPhone devices. Do not infer production readiness from a localhost score.

## Security and privacy release gate

1. Serve only the Vite `dist` and Laravel `public` directories. Never use the repository, `backend`, storage, `.local`, `.env`, `.git`, backups or native build directories as a document root. Deny dotfiles and PHP execution in static/upload directories. Keep private storage without a public symlink.
2. Set `APP_ENV=production`, `APP_DEBUG=false`, canonical HTTPS `APP_URL`, `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, `SESSION_SAME_SITE=lax`, `SESSION_ENCRYPT=true`, database/Redis sessions, and exact HTTPS `FRONTEND_URLS`/`SANCTUM_STATEFUL_DOMAINS`. Keep all privileged credentials server-side. Preserve the existing application key when moving encrypted data; key rotation requires a recovery/migration plan.
3. Allow only actual reverse-proxy IP addresses/CIDRs in `TRUSTED_PROXIES`. Do not trust `*` or arbitrary forwarded headers. Configure accepted hostnames at the edge, TLS termination and HTTP-to-HTTPS redirects; verify authentication, Secure cookies and canonical redirects through the real proxy.
4. Create a dedicated database user with a strong secret and least-privilege application grants. Use a separate migration account. The local October 13 follow-up uses a fresh password-protected account with SELECT/INSERT/UPDATE/DELETE on this database only, verified without global/schema grants. Provision the equivalent on the eventual production database; do not copy local credentials into release files. For remote MySQL, configure a verified CA (`MYSQL_ATTR_SSL_CA`), server identity checking and encrypted transport; verify negotiated TLS.
5. Run `php artisan security:check-production` with production configuration and require exit 0 in the release pipeline. It is a read-only check, not a complete infrastructure attestation. The middleware refuses insecure production URL/debug/session configurations with 503 and redirects HTTP to the configured HTTPS origin with 308.
6. Verify encrypted volumes/database/backups, access controls, key custody, encrypted backup copies and a restore drill. Newly uploaded résumé files are encrypted; legacy private PDFs and database text fields need a reviewed encryption migration or verified infrastructure encryption. No bulk rewrite was performed.
7. Deploy only supported, patched PHP, MySQL, web server and PDF extractor builds. The local Xpdf extractor was updated from 4.00 to 4.06 with a SHA-256 check against the Scoop distribution manifest; `scripts/setup-resume-tools.ps1 -ConfigureLocal` reproduces the Windows setup without replacing system Git utilities. Preserve the included license notices. Linux can use maintained Poppler `pdftotext`. Isolate the process under a low-privilege account/container with CPU/memory limits and no network access; evaluate malware scanning for public PDF uploads. The application caps PDF size, pages, extraction duration and output, but does not attest that an untrusted PDF is malware-free. The CLI checks a minimum version, not vendor backports or all parser CVEs.
8. Supply and approve the operator identity/address, privacy/DPO and unauthenticated support channels, purpose-specific lawful bases, sensitive-data safeguards, retention/backup expiry schedule, deletion/legal-hold procedures, incident response and minor-user/guardian procedures. Do not publish the current draft legal notices as approved policy. Verify necessary NPC registration/DPO obligations with qualified counsel.
9. Resolve the image/catalog redistribution evidence in ASSET-LICENSES.md; establish ongoing source availability checks. Configure and test real account recovery/support before public registration. Do not enable a log mailer for recovery or verification secrets.
10. Repeat dependency audits, authenticated staging security/CSRF/IDOR tests, accessibility and physical-device checks. Confirm no shared cache stores API, authentication or résumé responses. Retest security headers at the final edge, including errors, redirects and static assets. Review COOP and Trusted Types compatibility separately; neither was blindly enforced.

HSTS is sent by Laravel only for secure production requests. Apply it at the HTTPS edge for the SPA too, after TLS validation; review subdomains/preload independently. Do not use Vite preview or `php artisan serve` as a production service.
