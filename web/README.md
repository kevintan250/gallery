# Gallery (web)

Vite + React + TypeScript app.

## Local development

From this folder:

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This repo is configured to deploy via GitHub Actions using [/.github/workflows/deploy-pages.yml](../.github/workflows/deploy-pages.yml).

### One-time GitHub settings

1. Push your repo to GitHub and ensure the default branch is `main`.
2. In GitHub: **Settings → Pages**
   - **Build and deployment**: select **GitHub Actions**
3. In GitHub: **Settings → Actions → General**
   - Ensure workflows are allowed to run (defaults are usually fine).

### Make it live

1. Push/merge to `main`.
2. Go to **Actions** tab and wait for **Deploy web to GitHub Pages** to finish.
3. Your site will be available at:

`https://<your-username>.github.io/<your-repo-name>/`

### Notes

- The workflow builds with `BASE_PATH=/<repo-name>/` so asset URLs work on Pages.
- SPA refresh/deep links are handled via `public/404.html`.
