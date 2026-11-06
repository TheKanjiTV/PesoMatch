# PhilJobNet source access

On November 6, 2026, anonymous requests from this environment to the PhilJobNet vacancy catalog and two stored detail URLs returned HTTP 403 with the title `Web App - Unavailable`. The root connection also reset; the `www` hostname failed certificate hostname validation. The user reported a 404 in their browser. These observations establish an access problem, not that every vacancy was removed or closed. A recent search index still contained the official vacancy catalog, which is not proof of current access.

The imported records retain their original URLs and earlier source-check timestamps. No vacancy, bookmark, referral, account or profile was deleted or relabeled as newly verified because the source could not be reached.

`GET /api/public/vacancy-source-status` makes a bounded anonymous probe to the fixed HTTPS catalog URL. It never accepts a supplied destination, forwards account cookies, follows redirects or disables TLS validation. An atomic cache lock prevents concurrent probes, and results are cached for ten minutes. HTTP errors and soft error pages are distinguished from connection/redirect uncertainty. A successful catalog probe is not a guarantee that any individual vacancy is still open.

Vacancy Management displays portal access separately from each listing's historical check date. When current access is unavailable or unconfirmed, the detail page prioritizes PESO guidance for jobseekers and labels the original link as an explicit retry. Saved information remains viewable. The source is checked again on focus, restored connectivity and periodic foreground checks, using the server cache. The app does not claim to repair the external PhilJobNet service or submit an application while it is unavailable.
