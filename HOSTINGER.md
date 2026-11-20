# Hostinger files and GitHub source

The actual Git checkout and running Laravel backend are inside the **pesomatch.site** domain folder visible in hPanel File Manager:

```text
domains/pesomatch.site/
  app/                      Actual Git checkout, same tracked source as GitHub
    .git/                   Git history and origin/main
    .gitignore              Tracked root ignore rules
    package.json            React frontend commands
    src/                    React source
    public/                 React source assets
    backend/                Laravel source
      .env                  Actual private production file; ignored by Git
      artisan
      app/
      routes/
      storage/              Actual private persisted runtime files
      vendor/               Installed Composer dependencies; ignored
    node_modules/           Installed frontend dependencies; ignored
    dist/                   Generated React build; ignored
  public_html/              Published build plus protected Laravel entry shim
```

Enable **show hidden files** in File Manager to see `.gitignore`, `.git` and `backend/.env`. Do not open/share `.env` in screenshots or commit it. GitHub tracks source and `.env.example`; the production `.env`, dependencies, build output and private data exist on Hostinger as ignored runtime files. Tracked files must match GitHub; ignored production files must stay private.

The November 15 `app/pesomatch` copy is archived outside the domain before replacement. Old private releases remain rollback history; they are no longer the primary source or running backend. `~/apps/pesomatch/current` and the scheduler follow this domain checkout. Shared compatibility links point to its actual `.env` and storage.

## SSH updates

```bash
ssh -p 65002 u636932635@145.79.28.218
. ~/apps/pesomatch/runtime.sh
pwd                         # .../domains/pesomatch.site/app
git status --short
git fetch origin
revision=$(git rev-parse origin/main)
bash scripts/hostinger-domain-release.sh --plan "$revision"
bash scripts/hostinger-domain-release.sh --apply "$revision"
git log -1 --oneline
git diff --exit-code HEAD
ls -la
```

Make changes locally, commit and push first. The release performs a fresh Git clone of that exact revision, installs/builds, backs up the database and old directories, preserves the application key/private files, and replaces the domain `app` and `public_html` with verified results. A brief maintenance period covers the final storage sync/switch. Failures restore the previous paths; additive migrations are not reversed. Prior hashed assets, Android downloads/release metadata and domain verification files are retained.

An already-reviewed documentation-only commit can be synchronized with `git pull --ff-only` inside `app`. Do not make independent production source commits: that causes divergence from GitHub. A Git pull synchronizes source; `pnpm build` generates the frontend; Laravel cache commands refresh backend caches. Neither command alone performs every release step.
