# Browser Privacy Inspector: Technical and Security Guide

## Purpose and ethical boundary

Browser Privacy Inspector is a consent-based teaching application. It demonstrates information a normal webpage can read through standard browser APIs after the visitor deliberately starts a scan.

The design has four boundaries:

1. **Consent:** collection starts only after **Run Privacy Scan** is clicked.
2. **Local processing:** values are rendered in the same page and are not sent to a server.
3. **Data minimization:** the app does not access cookie contents, history, files, clipboard contents, location, camera, microphone, passwords, or authentication data.
4. **No identity construction:** values are not hashed, combined, stored, or reused as a persistent fingerprint.

The misuse discussion below is a defensive threat model. It helps students recognize and prevent abuse; it does not provide covert tracking, evasion, credential-theft, or unauthorized-access code.

## How the application was built

| File | Responsibility |
| --- | --- |
| `index.html` | Semantic landing page, consent control, dashboard, disclosures, and fingerprinting explanation |
| `styles.css` | Responsive layout, themes, result cards, score ring, risk colors, focus states, and reduced-motion support |
| `script.js` | Browser API reads, feature detection, result model, score calculation, safe rendering, and controls |
| `tests/smoke.cjs` | Desktop/mobile browser tests and outbound-request detection |
| `package.json` | Optional test tooling; the deployed application has no dependencies or build step |

Runtime flow:

```text
Page loads; no scan runs
        ↓
Visitor clicks Run Privacy Scan
        ↓
runScan() calls collectResults()
        ↓
safe() and feature checks handle unavailable APIs
        ↓
render() builds categorized educational cards
        ↓
An educational exposure score is calculated in memory
        ↓
Clear Results removes the rendered values
```

GitHub Pages serves the HTML, CSS, and JavaScript as static files. There is no server component.

## Main code design

### Consent gate

The scan is attached to a visitor action rather than page loading:

```js
ui.run.addEventListener("click", runScan);
```

`collectResults()` is called from `runScan()`. Keeping property reads behind this action is central to the consent model.

### Defensive feature detection

Support varies by browser, version, device, and privacy mode. The `safe()` helper prevents one unsupported property from stopping the report:

```js
function safe(getter, fallback = unavailable) {
  try {
    const value = getter();
    return value === undefined || value === null || value === ""
      ? fallback
      : value;
  } catch {
    return fallback;
  }
}
```

Optional chaining, such as `navigator.permissions?.query`, is also used before browser-dependent calls.

### Educational result model

Every signal is normalized by `item()`:

```js
item(
  category,
  propertyName,
  detectedValue,
  browserApi,
  privacySignificance,
  riskLevel,
  mitigation
);
```

This ensures every value has context, a risk label, and defensive advice.

### Safe rendering

Browser-provided values are treated as untrusted display text. `escapeHtml()` encodes HTML-significant characters before generated markup is rendered, preventing a value from being interpreted as HTML.

### Exposure score

The score is educational, not a scientific anonymity measurement. Available Low, Medium, and High signals receive weights of 1, 2, and 3:

```text
score = observed weighted signals / maximum weighted signals × 100
```

A lower score means fewer demonstrated properties were available. It does not prove that a visitor is anonymous or secure.

## Browser APIs used

These examples are simplified, read-only snippets. The application wraps access in error handling and supplies an explanation.

### Browser identity and language

```js
const userAgent = navigator.userAgent;
const vendor = navigator.vendor;
const platform = navigator.userAgentData?.platform || navigator.platform;
const language = navigator.language;
const languages = navigator.languages;
```

- **Legitimate uses:** compatibility and localization.
- **Privacy concern:** browser, operating-system, and unusual ordered language combinations narrow the population a visitor belongs to.

### Time and locale

```js
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const localTime = new Date().toLocaleString();
```

These support correct date display but may suggest a broad region when combined with language and other properties.

### Device characteristics

```js
const logicalProcessors = navigator.hardwareConcurrency;
const approximateMemoryGiB = navigator.deviceMemory;
const touchPoints = navigator.maxTouchPoints;
```

These are coarse performance and input hints, not exact hardware inventory. Memory is unsupported in many browsers.

### Display and window information

```js
const screenSize = `${screen.width} × ${screen.height}`;
const availableArea = `${screen.availWidth} × ${screen.availHeight}`;
const viewport = `${window.innerWidth} × ${window.innerHeight}`;
const pixelRatio = window.devicePixelRatio;
const colorDepth = screen.colorDepth;
```

Responsive sites need viewport measurements. Exact combinations of resolution, window size, scaling, and color depth can also increase fingerprint distinctiveness.

### Browser and connection state

```js
const believedOnline = navigator.onLine;
const connection = navigator.connection;
const connectionClass = connection?.effectiveType;
const dataSaver = connection?.saveData;
```

`navigator.onLine` is only the browser's current belief; it does not prove a server is reachable. Network Information data is coarse and unavailable in many browsers.

### Privacy preferences

```js
const cookiesEnabled = navigator.cookieEnabled;
const doNotTrack = navigator.doNotTrack;
const globalPrivacyControl = navigator.globalPrivacyControl;
```

These describe capability or preference. `navigator.cookieEnabled` does not expose cookie contents. Do Not Track is voluntary; Global Privacy Control may carry legal significance in supported jurisdictions.

### Permission states without requesting access

The app queries existing states but never requests permission or reads sensor data:

```js
if (navigator.permissions?.query) {
  const status = await navigator.permissions.query({ name: "camera" });
  console.log(status.state); // granted, denied, or prompt
}
```

This is different from calling `getUserMedia()`, geolocation, or clipboard methods. Those access APIs are not used.

### WebGL information

```js
const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl");
const debug = gl?.getExtension("WEBGL_debug_renderer_info");
```

When permitted, the extension can expose graphics vendor and renderer strings. Browsers may withhold them. This project reads the strings for education but does not generate rendering challenges or derive an identifier.

### Storage availability

The app creates one temporary key and immediately removes it:

```js
const key = "__privacy_inspector_test__";
localStorage.setItem(key, "1");
localStorage.removeItem(key);
```

The same check is performed for `sessionStorage`. Scan results are never stored.

### Feature and preference detection

The app checks for Web Workers, Service Workers, WebAssembly, Web Crypto, and WebRTC. It also reads accessibility/display preferences:

```js
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const darkMode = matchMedia("(prefers-color-scheme: dark)").matches;
```

Feature detection is preferable to guessing capabilities from a user-agent string.

## How to change the project

### Add a signal

1. Open `script.js` and locate `collectResults()`.
2. Read the property with `safe()` or explicit feature detection.
3. Add an `item()` with all seven fields.
4. Choose the least severe justified risk level.
5. Include a practical mitigation or explain why none is necessary.
6. Run syntax and browser tests.

Example using a low-risk accessibility preference:

```js
item(
  "Browser capabilities",
  "Contrast preference",
  matchMedia("(prefers-contrast: more)").matches
    ? "More contrast"
    : "No preference",
  "CSS prefers-contrast media query",
  "Helps sites provide a more readable interface.",
  "Low",
  "Keep accessibility settings configured for your needs."
)
```

Do not add signals that require sensitive prompts, read personal content, contact enrichment services, or create persistent identifiers.

### Add or rename a category

Update `CATEGORY_ORDER` near the top of `script.js`, then use the exact string in each associated `item()`. Navigation and sections are generated automatically.

### Change risks or scoring

Edit `riskWeight` and the calculation inside `render()`. Document the rationale. Do not call it a formal security score unless a validated methodology replaces the educational model.

### Change the visual design

- Colors and type: custom properties at the top of `styles.css`.
- Light theme: `[data-theme="light"]`.
- Mobile breakpoints: `@media` blocks near the end of `styles.css`.
- Score visualization: `.score-ring` and its `conic-gradient`.
- Text and disclosures: `index.html`.

Preserve visible focus, color contrast, semantic headings, the skip link, and reduced-motion behavior.

## Defensive threat model: how features may be abused

Browser properties are not vulnerabilities by themselves. Risk comes from combining them with identifiers, storage, network records, or deception.

### Fingerprinting and linkability

A tracker may combine screen dimensions, timezone, language order, graphics information, and supported features into a compact value. Repeated observations may estimate whether visits came from the same browser.

Defenses include browser anti-fingerprinting modes, signal reduction, storage partitioning, tracker blocking, script restrictions, and collection/retention limits.

### Cross-session recognition

Persistent storage can remember an identifier. A tracking system may combine storage with browser signals to strengthen recognition after cookies change.

Defenses include third-party storage blocking, state partitioning, clearing site data, and private browsing when appropriate.

### Profiling and inference

Language, timezone, hardware class, preferences, and connection characteristics can support broad—and sometimes incorrect—inferences about region or user context. Using such inferences for consequential decisions can be unfair or unlawful.

Defensive engineering requires purpose limitation, minimization, short retention, access control, bias review, transparency, and legal review.

### Permission manipulation

A deceptive site may pressure visitors to grant camera, microphone, notification, clipboard, or location access. Responsible design explains the feature first, asks only when needed, and remains useful after denial.

Users should deny unexpected prompts and review site permissions periodically.

### Capability-based targeting

Feature detection could select browser-specific deceptive content or target obsolete software. Responsible sites use it for compatibility and progressive enhancement. Keep browsers updated and review unusual client-side branching in untrusted applications.

### Defensive source-review indicators

Look for unexpected use of:

- `fetch()` or `XMLHttpRequest`;
- `navigator.sendBeacon()`;
- `WebSocket` or `EventSource`;
- dynamically created remote scripts, images, or frames;
- analytics or advertising SDKs;
- long-lived storage values; or
- hashing/encoding applied to a large group of browser properties.

One method alone does not prove abuse. Review the destination, purpose, payload, consent, retention, and disclosure together.

## Safe testing and verification

```powershell
npm install
npx playwright install chromium
npm test
```

The smoke test checks consent gating, rendering, clearing, desktop/mobile overflow, console errors, and requests to external origins.

Manual review:

1. Open Developer Tools and select **Network**.
2. Reload and run the scan.
3. Confirm only local HTML, CSS, and JavaScript assets load.
4. Confirm no sensitive permission prompt appears.
5. Test different browsers and privacy settings for unavailable APIs.
6. Inspect storage and verify scan results are not persisted.

## Responsible-use checklist

Before adding a browser signal, ask:

- Is it necessary for a stated educational or functional purpose?
- Can less detailed data achieve the same goal?
- Does it require permission or expose personal content?
- Is it processed locally and discarded promptly?
- Is the visitor informed before collection?
- Could combining it with other values make a browser more recognizable?
- Is there an opt-out and useful experience without it?
- Do tests prove the privacy claim?

If the answers are unclear, do not collect the signal until the design receives privacy and security review.

## Further study

Defensive topics include fingerprinting resistance, privacy budgets, storage partitioning, Content Security Policy, Permissions Policy, same-origin policy, secure contexts, third-party cookie controls, and privacy threat modeling. Study real systems only in environments and accounts you own or have explicit authorization to test.
