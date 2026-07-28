# WWAM public publishing

The Mike-facing public build is generated from `public/demo`; pipeline files, tests, source caches, and private work artifacts are never included.

## Public URLs

- Friendly entry: `https://shokkergroup.github.io/wwam-after-midnight/`
- Direct archive: `https://shokkergroup.github.io/wwam-after-midnight/wiki/index.html`

## Release flow

1. Run `npm run build:pages` locally to validate and stage the exact public bundle in `_site/`.
2. Commit the verified WWAM changes to `main`.
3. Push `main` to `shokkergroup/wwam-after-midnight`.
4. GitHub Actions publishes `_site/` automatically. The deployment keeps query strings and hash routes intact.

GitHub Pages needs one initial repository setup: create the public repository, connect this checkout as `origin`, and select **GitHub Actions** under Settings → Pages → Build and deployment. After that, every push to `main` updates Mike's public demo without a manual file-copy step.