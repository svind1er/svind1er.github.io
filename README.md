# writeup-github

Static writeups/research blog built with Eleventy.

## Local dev

```sh
npm install
npm run start
```

Build output goes to `_site/`.

## Obsidian writeups

Put Markdown writeups in `src/writeups/` and make sure each file has front matter like the examples:

```md
---
layout: layouts/post.njk
title: "My Writeup Title"
date: 2024-05-12
category: Crypto
difficulty: Easy
tags: [HTB]
description: "One-line summary for cards/lists."
---
```

Notes for Obsidian:

- Wikilinks like `[[Page]]` and embeds like `![[image.png]]` are not supported by default; use standard Markdown links instead.
- For images/attachments, copy files into `src/assets/` and reference them as `/assets/filename.png`.
- Keep filenames lowercase with hyphens to match the existing writeups.

## Deploy to GitHub Pages (user site)

These steps target a user site repo like `username.github.io` so the site is served at `https://username.github.io/`.

1) Create a new GitHub repo named `username.github.io` and push this project to it.
2) Add the GitHub Actions workflow below at `.github/workflows/deploy.yml`.
3) In the repo settings, go to **Pages** and set **Source** to **GitHub Actions**.
4) Push to `main` and wait for the workflow to deploy.

### GitHub Actions workflow

```yml
name: Deploy Eleventy site

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Custom domain (e.g. `username.io`)

1) Create a file at `src/CNAME` with the domain name on a single line, for example:

```
username.io
```

2) Set DNS:
- Apex domain (`username.io`) should point to GitHub Pages A records.
- `www` should be a CNAME to `username.github.io`.

3) In **Settings > Pages**, set the custom domain to `username.io`.

GitHub will auto-issue HTTPS once the DNS is correct.
