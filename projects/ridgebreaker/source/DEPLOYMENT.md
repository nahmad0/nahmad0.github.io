# GitHub Pages deployment

Public game: https://nahmad0.github.io/projects/ridgebreaker/

Repository: https://github.com/nahmad0/nahmad0.github.io

The repository's `projects/ridgebreaker/` directory holds the compiled static game. Its `source/` directory holds the maintainable TypeScript project, documentation, reference sketch, and tests. The site's main branch is served from the repository root by the existing GitHub Pages configuration.

`vite.config.ts` uses relative asset URLs so the same build works under a nested Pages path. No paid services, backend, generation API, or hosting credentials are part of the game.

To update from a checkout of the Pages repository:

1. Edit `projects/ridgebreaker/source/`.
2. Run `npm install` and `npm run build` inside that source directory.
3. Replace only the generated `index.html`, `favicon.svg`, and `assets/` under `projects/ridgebreaker/` with that build's `dist/` contents. Keep `source/` and the other website projects intact.
4. Commit and push to `main`, then verify the GitHub Pages deployment and live game.

The publication smoke test validates that the homepage has the Ridgebreaker link, has no Personal portfolio heading, and that the production game loads its assets and responds to throttle:

```sh
node tests/publication-smoke.mjs https://nahmad0.github.io
```

The previous portfolio site was not deleted; only its homepage card and descriptive mentions were replaced.
