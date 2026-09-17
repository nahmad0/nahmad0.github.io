# Browser Privacy Inspector

Browser Privacy Inspector is a consent-based educational website that demonstrates information a normal webpage can learn through standard browser APIs. It runs entirely in the browser and is designed for static hosting on GitHub Pages.

## Privacy guarantees

- The scan runs only after the visitor clicks **Run Privacy Scan**.
- Results remain in page memory and are never uploaded.
- There are no analytics, tracking pixels, remote fonts, CDNs, cookies, or backend services.
- The app does not inspect passwords, authentication tokens, cookie contents, browsing history, files, clipboard contents, camera or microphone data, or precise location.
- It does not create or store a browser fingerprint. Its storage checks create one temporary test key and immediately delete it.
- Permission status is queried without requesting permission or reading protected data.

Opening the GitHub link in the footer is the only user-initiated navigation to another origin.

## Architecture

```text
browser-privacy-inspector/
├── index.html   Semantic page structure and consent-first interface
├── styles.css   Responsive design, themes, score visualization
├── script.js    Feature detection, local scan, scoring, rendering
├── tests/       Desktop/mobile browser smoke test
├── package.json Optional test tooling (not needed by the website)
├── README.md    Documentation and deployment guide
└── .gitignore   Common local files excluded from version control
```

The project uses no framework, build step, package dependency, or server. `script.js` is organized around collection, normalization, rendering, and UI-control functions. Each browser API access uses feature detection or guarded error handling.

## Demonstrated APIs

The scan covers `navigator` browser and device properties, `screen` and viewport dimensions, `Intl.DateTimeFormat`, online state, the Network Information API when present, privacy preferences, the Permissions API in query-only mode, WebGL capability strings, Web Storage availability, media queries, and selected feature detection.

Some APIs are deliberately restricted or unavailable in certain browsers. The interface reports that state instead of inventing a value.

## Technical documentation

See [Browser Privacy Inspector: Technical and Security Guide](docs/TECHNICAL_GUIDE.md) for:

- how the application was built and how data flows through it;
- the exact browser APIs and code patterns used for each result;
- how to add signals, categories, themes, and risk guidance safely;
- how ordinary browser features may be abused for fingerprinting, profiling, or deceptive permission requests; and
- defensive review, testing, and responsible-use guidance.

The threat discussion is intentionally defensive and does not include covert tracking or exploitation code.

## Local development

No build is required. Open `index.html` directly, or serve the directory locally:

```powershell
cd browser-privacy-inspector
npx serve .
```

Then open the local URL printed by the server. A local server more closely matches GitHub Pages behavior, especially for APIs that require a secure context.

To run the automated browser smoke test, install the optional development dependencies and Chromium once, then test:

```powershell
npm install
npx playwright install chromium
npm test
```

## Deploy to GitHub Pages

1. Create an empty GitHub repository and add these files at its root.
2. Commit and push the files to the default branch.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the default branch, choose `/ (root)`, and save.
6. After GitHub finishes deployment, open the displayed `https://<username>.github.io/<repository>/` URL.

Because every asset uses a relative path and the app has no routing or backend, it works from a GitHub Pages project subpath.

## Limitations

- The exposure score is an educational indicator based on which demonstrated signals are available and their assigned risk tiers. It is not a formal security, anonymity, or fingerprint-uniqueness measurement.
- Browser vendors frequently reduce, rename, or remove exposed properties. Results differ by browser, privacy mode, extension policy, and device.
- `navigator.onLine` reflects the browser's connection belief, not proof that the internet is reachable.
- WebGL details and permission states may be hidden by the browser.
- This project intentionally does not contact an IP-geolocation service, so it does not display public IP address or inferred location.

## Security review checklist

- Search the source for `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, external scripts, analytics, and remote resource URLs.
- Run `node --check script.js` after changes.
- Test the page with developer tools open and confirm no console errors or automatic network requests.
- Test at desktop and mobile viewport widths and verify keyboard navigation and focus indicators.
