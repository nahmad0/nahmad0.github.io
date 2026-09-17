(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const ui = {
    hero: $("#hero"), dashboard: $("#dashboard"), run: $("#run-scan"),
    again: $("#scan-again"), clear: $("#clear-results"), theme: $("#theme-toggle"),
    results: $("#results"), nav: $("#section-nav")
  };

  const CATEGORY_ORDER = ["Browser", "Device", "Display", "Network & browser state", "Privacy settings", "Browser capabilities"];
  const riskWeight = { Low: 1, Medium: 2, High: 3 };
  const unavailable = "Unavailable or not exposed by this browser";

  function item(category, name, value, api, significance, risk, mitigation) {
    return { category, name, value: value === undefined || value === null || value === "" ? unavailable : String(value), api, significance, risk, mitigation };
  }

  function safe(getter, fallback = unavailable) {
    try { const value = getter(); return value === undefined || value === null || value === "" ? fallback : value; }
    catch { return fallback; }
  }

  function yesNo(value) { return value ? "Supported" : "Not supported"; }
  function storageAvailable(type) {
    try {
      const storage = window[type];
      const key = "__privacy_inspector_test__";
      storage.setItem(key, "1"); storage.removeItem(key);
      return "Available";
    } catch { return "Unavailable or blocked"; }
  }

  // Creates a WebGL context only to read standard capability strings; nothing is drawn or transmitted.
  function getWebGLInfo() {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return { available: "Not supported or disabled", vendor: unavailable, renderer: unavailable };
      const debug = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        available: "Available",
        vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : "Browser withheld detailed vendor",
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "Browser withheld detailed renderer"
      };
    } catch { return { available: "Unavailable", vendor: unavailable, renderer: unavailable }; }
  }

  async function permissionSummary() {
    if (!navigator.permissions?.query) return unavailable;
    const names = ["geolocation", "notifications", "camera", "microphone"];
    const results = [];
    for (const name of names) {
      try {
        // Querying permission state does not request access or read sensor data.
        const status = await navigator.permissions.query({ name });
        results.push(`${name}: ${status.state}`);
      } catch { results.push(`${name}: not queryable`); }
    }
    return results.join(" · ");
  }

  async function collectResults() {
    const webgl = getWebGLInfo();
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const features = ["Web Workers", "Service Workers", "WebAssembly", "Web Crypto", "WebRTC"]
      .map((name, index) => `${name}: ${yesNo([window.Worker, navigator.serviceWorker, window.WebAssembly, window.crypto?.subtle, window.RTCPeerConnection][index])}`)
      .join(" · ");
    const touchPoints = safe(() => navigator.maxTouchPoints, 0);
    const permissionStates = await permissionSummary();

    return [
      item("Browser", "User agent", safe(() => navigator.userAgent), "navigator.userAgent", "Identifies the browser family and often the operating system; useful for compatibility but contributes to fingerprinting.", "High", "Use a privacy-focused browser or built-in anti-fingerprinting protection. User-agent reduction may limit detail."),
      item("Browser", "Browser vendor", safe(() => navigator.vendor), "navigator.vendor", "Indicates the browser engine vendor and narrows the browser family.", "Low", "Modern browsers may reduce or standardize this value."),
      item("Browser", "Preferred language", safe(() => navigator.language), "navigator.language", "Helps localize content but can narrow a visitor's profile.", "Medium", "Limit unusual language combinations and review browser language settings."),
      item("Browser", "Additional languages", safe(() => navigator.languages?.join(", ")), "navigator.languages", "An ordered language list can be more distinctive than one preferred language.", "Medium", "Remove languages you do not use from browser settings."),
      item("Browser", "Timezone", safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone), "Intl.DateTimeFormat", "Provides an approximate region and contributes to a combined fingerprint.", "Medium", "Some privacy modes standardize timezones; otherwise this is difficult to hide without affecting sites."),
      item("Browser", "Local date and time", new Date().toLocaleString(), "Date + locale formatting", "Reveals the device clock, locale formatting, and timezone offset indirectly.", "Low", "Keep the system clock accurate; privacy browsers may normalize time-related signals."),

      item("Device", "Platform", safe(() => navigator.userAgentData?.platform || navigator.platform), "navigator.userAgentData / navigator.platform", "Reveals the operating-system family when the browser exposes it.", "Medium", "Use browser anti-fingerprinting features; platform values are increasingly reduced."),
      item("Device", "Logical CPU count", safe(() => navigator.hardwareConcurrency), "navigator.hardwareConcurrency", "Approximate processor parallelism can help tailor performance and distinguish device classes.", "Medium", "Some privacy browsers report a standardized value."),
      item("Device", "Approximate memory", safe(() => navigator.deviceMemory ? `${navigator.deviceMemory} GiB (approximate)` : unavailable), "navigator.deviceMemory", "A coarse memory estimate helps performance tuning and may narrow the device class.", "Medium", "Unsupported in many browsers; privacy protections may coarsen or suppress it."),
      item("Device", "Touch capability", `${touchPoints} maximum touch point${Number(touchPoints) === 1 ? "" : "s"}`, "navigator.maxTouchPoints", "Distinguishes touch-capable devices from mouse/keyboard-oriented systems.", "Low", "Usually low impact alone; anti-fingerprinting modes may standardize this."),

      item("Display", "Screen resolution", safe(() => `${screen.width} × ${screen.height} CSS pixels`), "screen.width / screen.height", "Screen dimensions are useful for layout but are a common fingerprint component.", "High", "Avoid maximizing the browser or use privacy features that letterbox/standardize window sizes."),
      item("Display", "Available screen area", safe(() => `${screen.availWidth} × ${screen.availHeight} CSS pixels`), "screen.availWidth / screen.availHeight", "Can suggest operating-system interface dimensions and screen setup.", "Medium", "Privacy browsers may round or standardize screen measurements."),
      item("Display", "Browser viewport", `${window.innerWidth} × ${window.innerHeight} CSS pixels`, "window.innerWidth / window.innerHeight", "Needed for responsive design, but exact window dimensions can add uniqueness.", "Medium", "Use common window sizes or browser letterboxing where available."),
      item("Display", "Device pixel ratio", safe(() => window.devicePixelRatio), "window.devicePixelRatio", "Reveals display scaling or pixel density and can distinguish device types.", "Medium", "Browser anti-fingerprinting may standardize this value."),
      item("Display", "Color depth", safe(() => `${screen.colorDepth} bits`), "screen.colorDepth", "Describes display color capability and adds a small fingerprint signal.", "Low", "This value is usually common and has little impact alone."),

      item("Network & browser state", "Connection status", navigator.onLine ? "Online" : "Offline", "navigator.onLine", "Shows whether the browser believes a network connection is available; it does not reveal browsing history.", "Low", "No action is usually necessary."),
      item("Network & browser state", "Connection type", safe(() => connection?.effectiveType), "Network Information API", "A coarse connection class can help sites reduce data use but may reveal network conditions.", "Low", "This API is unavailable in many browsers and can be disabled through browser policy."),
      item("Network & browser state", "Data saver preference", safe(() => connection ? (connection.saveData ? "Enabled" : "Disabled") : unavailable), "navigator.connection.saveData", "Lets sites provide lighter experiences when a user requests reduced data usage.", "Low", "Change the data-saver setting in your browser or operating system."),

      item("Privacy settings", "Cookies", navigator.cookieEnabled ? "Enabled" : "Disabled", "navigator.cookieEnabled", "Cookies can maintain sessions and preferences; third-party cookies can also support cross-site tracking.", "High", "Block third-party cookies, clear site data, or use isolated/private browsing contexts."),
      item("Privacy settings", "Do Not Track", safe(() => navigator.doNotTrack), "navigator.doNotTrack", "Communicates a tracking preference, but websites are not required to honor it.", "Low", "Use tracker blocking in addition to this preference."),
      item("Privacy settings", "Global Privacy Control", safe(() => typeof navigator.globalPrivacyControl === "boolean" ? (navigator.globalPrivacyControl ? "Enabled" : "Disabled") : unavailable), "navigator.globalPrivacyControl", "Signals a request not to sell or share personal data where supported by law and websites.", "Low", "Enable Global Privacy Control in a supporting browser or extension."),
      item("Privacy settings", "Permission states", permissionStates, "Permissions API (query only)", "Shows existing permission states without requesting access or reading location, camera, or microphone data.", "High", "Review and revoke unneeded site permissions in browser settings."),

      item("Browser capabilities", "WebGL", webgl.available, "canvas.getContext('webgl')", "WebGL enables rich graphics. Its presence and graphics details can contribute to fingerprinting.", "Medium", "Privacy browsers may restrict WebGL or its identifying details; disabling it can break 3D sites."),
      item("Browser capabilities", "WebGL vendor", webgl.vendor, "WEBGL_debug_renderer_info", "The graphics vendor can narrow the hardware and driver family.", "High", "Use anti-fingerprinting protection that masks WebGL details."),
      item("Browser capabilities", "WebGL renderer", webgl.renderer, "WEBGL_debug_renderer_info", "A detailed graphics renderer string is one of the more distinctive browser signals.", "High", "Use browser fingerprinting protection; blocking WebGL may affect graphics-heavy sites."),
      item("Browser capabilities", "Feature support", features, "Feature detection", "Supported APIs reveal browser capabilities and version boundaries without accessing personal content.", "Medium", "Keep the browser updated; privacy modes may standardize exposed features."),
      item("Browser capabilities", "Local storage", storageAvailable("localStorage"), "window.localStorage", "Allows persistent data on this site. This demo only performs a temporary test and immediately removes it.", "Medium", "Clear site data, block storage for untrusted sites, or use private browsing."),
      item("Browser capabilities", "Session storage", storageAvailable("sessionStorage"), "window.sessionStorage", "Stores data for one tab session. This demo only performs a temporary test and immediately removes it.", "Low", "Closing the tab normally clears session storage; browser controls can block it."),
      item("Browser capabilities", "PDF viewer", safe(() => navigator.pdfViewerEnabled === undefined ? unavailable : (navigator.pdfViewerEnabled ? "Built in" : "Not built in")), "navigator.pdfViewerEnabled", "Indicates a built-in capability and offers a small browser-identification signal.", "Low", "No action is usually necessary."),
      item("Browser capabilities", "Reduced motion preference", matchMedia("(prefers-reduced-motion: reduce)").matches ? "Reduce" : "No preference", "CSS prefers-reduced-motion media query", "An accessibility preference helps respectful design and contributes only a small signal.", "Low", "Keep accessibility preferences set to your needs; usability matters more than hiding this low-risk value."),
      item("Browser capabilities", "Color scheme preference", matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light", "CSS prefers-color-scheme media query", "Helps sites match the interface to your system theme and adds a small fingerprint signal.", "Low", "No action is usually necessary."),
    ];
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function render(items) {
    ui.results.textContent = ""; ui.nav.textContent = "";
    for (const category of CATEGORY_ORDER) {
      const grouped = items.filter((entry) => entry.category === category);
      const id = `section-${category.toLowerCase().replace(/[^a-z]+/g, "-")}`;
      const link = document.createElement("a"); link.href = `#${id}`; link.textContent = category; ui.nav.append(link);
      const section = document.createElement("section"); section.className = "result-section"; section.id = id;
      section.innerHTML = `<div class="section-heading"><h2>${escapeHtml(category)}</h2><span>${grouped.length.toString().padStart(2, "0")} signals</span></div><div class="result-list">${grouped.map((entry) => `
        <details class="result-card">
          <summary><span class="property-name">${escapeHtml(entry.name)}</span><span class="property-value">${escapeHtml(entry.value)}</span><span class="risk-badge ${entry.risk.toLowerCase()}">${entry.risk}</span><span class="chevron" aria-hidden="true">›</span></summary>
          <div class="card-details">
            <div><span class="detail-label">Browser API used</span><p><code>${escapeHtml(entry.api)}</code></p></div>
            <div><span class="detail-label">Why it matters</span><p>${escapeHtml(entry.significance)}</p></div>
            <div><span class="detail-label">Reduce exposure</span><p>${escapeHtml(entry.mitigation)}</p></div>
          </div>
        </details>`).join("")}</div>`;
      ui.results.append(section);
    }

    const counts = { Low: 0, Medium: 0, High: 0 };
    items.forEach((entry) => counts[entry.risk]++);
    $("#low-count").textContent = counts.Low; $("#medium-count").textContent = counts.Medium; $("#high-count").textContent = counts.High;
    // Exposure score is an educational indicator based on visible, available signals—not an anonymity test.
    const availableItems = items.filter((entry) => !entry.value.toLowerCase().includes("unavailable") && !entry.value.toLowerCase().includes("withheld"));
    const max = items.reduce((sum, entry) => sum + riskWeight[entry.risk], 0);
    const observed = availableItems.reduce((sum, entry) => sum + riskWeight[entry.risk], 0);
    const score = Math.round((observed / max) * 100);
    const label = score >= 75 ? "High exposure" : score >= 50 ? "Moderate exposure" : "Lower exposure";
    $("#score-value").textContent = score; $("#score-label").textContent = label;
    $("#score-description").textContent = `${availableItems.length} of ${items.length} demonstrated signals were available. Lower is more private.`;
    $("#score-ring").style.setProperty("--score", score); $("#score-ring").setAttribute("aria-label", `Privacy exposure score: ${score} out of 100, ${label}`);
  }

  async function runScan() {
    ui.run.disabled = true; ui.run.lastElementChild;
    try {
      const results = await collectResults();
      render(results); $("#scan-time").textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      ui.hero.hidden = true; ui.dashboard.hidden = false; window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Privacy scan could not complete:", error);
      alert("The scan could not complete. No information was saved or sent. Try reloading the page.");
    } finally { ui.run.disabled = false; }
  }

  function clearResults() {
    ui.results.replaceChildren(); ui.nav.replaceChildren(); ui.dashboard.hidden = true; ui.hero.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" }); ui.run.focus({ preventScroll: true });
  }

  function toggleTheme() {
    const root = document.documentElement; const light = root.dataset.theme !== "light";
    root.dataset.theme = light ? "light" : "dark";
    ui.theme.innerHTML = `<span aria-hidden="true">${light ? "☾" : "☼"}</span>`;
    ui.theme.setAttribute("aria-label", `Switch to ${light ? "dark" : "light"} theme`);
  }

  document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  if (document.documentElement.dataset.theme === "light") { ui.theme.innerHTML = '<span aria-hidden="true">☾</span>'; ui.theme.setAttribute("aria-label", "Switch to dark theme"); }
  ui.run.addEventListener("click", runScan); ui.again.addEventListener("click", runScan); ui.clear.addEventListener("click", clearResults); ui.theme.addEventListener("click", toggleTheme);
})();
