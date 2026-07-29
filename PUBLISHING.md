# WWAM public publishing

The public Pages build is generated from `public/demo`; pipeline files, tests, source caches, and private work artifacts are never included.

## Public URLs

- Friendly entry: `https://shokkergroup.github.io/wwam-after-midnight/`
- Direct archive: `https://shokkergroup.github.io/wwam-after-midnight/wiki/index.html`
- Hosted mirror: `https://wwam-after-midnight.downndirtytn.chatgpt.site/demo/`

## Release flow

1. Run `npm run build:pages` locally to validate and stage the exact public bundle in `_site/`.
2. Commit the verified WWAM changes to `main`.
3. Push `main` to `shokkergroup/wwam-after-midnight`.
4. GitHub Actions publishes `_site/` automatically. The deployment keeps query strings and hash routes intact, so Mike can keep the same link after every release.
5. Save and deploy the exact pushed commit to the existing Sites project when the hosted mirror should move with the GitHub Pages release.

GitHub Pages is already configured to use GitHub Actions. Every push to `main` updates the same public demo without a manual file-copy step.
