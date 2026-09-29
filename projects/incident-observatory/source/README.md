# Incident Observatory — Realistic Edition

See **VISUAL_TUNING_GUIDE.md** for the live tuning panel, presets, saved looks, visual recipes and exact source-edit locations. This directory is an independent full copy of the original sibling project, enhanced with more detailed procedural hardware and room surfaces.

A local, educational browser reconstruction of the July 2026 OpenAI / Hugging Face incident, including its earlier warning signs. This is a working first prototype, not the completed high-fidelity experience described in the original project brief.

## Run

Requires a current Node.js installation compatible with the pinned Vite version.

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:4174. The server binds to loopback only. `npm run build` creates `dist/`; `npm run preview` serves that build on the same port after the dev server is stopped.

## Available now

- 19 events with primary-source links and explicit date precision.
- Three.js infrastructure, schematic trust enclosures, animated connections, packet movement, camera following, orbit and zoom.
- Play/pause, restart, previous/next, a scrubber, and speeds from 0.25× to 10×.
- Agent and defender perspectives, synthetic activity records and selectable assets.
- Eight view selectors. Infrastructure and topology share the scene; attack graph shows paths encountered so far. Kubernetes and identity combine filtered 3D scenes with dedicated synthetic boundary/permission/control cards; communication is a filtered scene. SOC and timeline are interactive lists.
- Teaching questions with answer feedback and resumed playback.
- Source/uncertainty dialog, keyboard-accessible controls, reduced-motion camera behavior and responsive layout.

The app runs entirely in the browser. It contains no working exploits or credentials, and emits no incident-related requests. External source links open only when the reader selects them. Asset identities, layout, counts, severity and telemetry are fictional teaching aids. Presentation seconds are not elapsed historical time.

## Data and extension

`src/incident.json` is the runtime incident file. `scripts/build-data.mjs` is the editable authoring helper that generates it. Edit the helper and run `node scripts/build-data.mjs` to regenerate this incident; keep the two synchronized. Another compatible incident JSON can replace the imported file in `src/main.js`. The renderer uses declared systems, paths and event state; view membership, titles and camera presets now live in incident.views. Room layout and organization labels now live in incident.environment; adapt those records for another incident while preserving the shared rendering style.

`schema/incident.schema.json` defines the initial data contract. `src/model.js` validates cross-record references and derives deterministic state. `ARCHITECTURE.md` records the storyboard and component responsibilities.

## Verification

```powershell
npm test
npm run build
node scripts/browser-check.mjs <absolute-path-to-playwright-package>
```

Browser checks require installed Microsoft Edge and Playwright. They operate only on the local preview. Results and screenshots are written to ignored `.test-artifacts/`.

The initial browser run passed playback, seeking, view switching, alert focus, teaching feedback, source dialog, restart and mobile-width checks, with no page errors or external requests. Production bundling and twelve deterministic data/model tests passed. The production build, WebGL-unavailable fallback, reduced-motion scene stability, continued playback under reduced motion, and basic keyboard controls have now passed explicit browser checks. More expressive boundary-crossing animation and a fuller event-by-event response explanation remain follow-up work.




## Production and accessibility checks
`scripts/production-check.mjs` tests a built preview on port 4175 (optional third argument overrides the base URL). It verifies that reduced-motion preference stops packet/ring animation while timeline playback continues, and that timeline selection, playback, source-dialog dismissal and visual settings remain usable when WebGL is unavailable. Run `npm run build`, then `npm run preview -- --port 4175` and, in another terminal, run the checker with the same Playwright package path used by the main browser check. These checks are focused behavioral coverage, not a full accessibility audit.


