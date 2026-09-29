# Incident Observatory

[Open the lab](https://nahmad0.github.io/projects/incident-observatory/) · [Source](source/) · [Visual tuning guide](source/VISUAL_TUNING_GUIDE.md)

Interactive educational reconstruction of the July 2026 OpenAI / Hugging Face incident. Historical claims link to sources; topology, identities, alerts and telemetry are synthetic teaching aids. This is a working prototype. All simulation runs in the browser, without incident infrastructure connections.

The production build is in this directory; editable code and documentation are in `source/`. To rebuild, run `npm ci`, `npm test`, and `npm run build` inside `source/`, then copy the contents of `source/dist/` here, preserving `source/` and this README. Vite uses relative asset paths for GitHub Pages.

Use **Visual tuning** in the app to change its look. **Sources & accuracy** includes links back to the portfolio, source and guide.
