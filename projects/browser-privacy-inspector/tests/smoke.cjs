const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

const server = http.createServer((request, response) => {
  const pathname = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    response.writeHead(404); response.end("Not found"); return;
  }
  response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const failures = [];

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewportSize: viewport });
    page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });
    page.on("pageerror", (error) => failures.push(`page: ${error.message}`));
    page.on("request", (request) => { if (!request.url().startsWith(origin)) failures.push(`external request: ${request.url()}`); });

    await page.goto(origin, { waitUntil: "networkidle" });
    if (await page.locator("#dashboard").isVisible()) failures.push("scan ran without consent");
    await page.getByRole("button", { name: "Run Privacy Scan", exact: true }).click();
    await page.locator("#dashboard").waitFor({ state: "visible" });
    const sections = await page.locator(".result-section").count();
    const cards = await page.locator(".result-card").count();
    if (sections !== 6) failures.push(`expected 6 sections, saw ${sections}`);
    if (cards < 25) failures.push(`expected at least 25 result cards, saw ${cards}`);
    if ((await page.locator("body").evaluate((body) => body.scrollWidth > innerWidth + 1))) failures.push(`horizontal overflow at ${viewport.width}px`);
    await page.getByRole("button", { name: "Clear Results" }).click();
    if (!(await page.locator("#hero").isVisible())) failures.push("clear did not restore landing page");
    await page.close();
  }

  await browser.close(); server.close();
  if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
  console.log("Smoke tests passed: consent gate, scan rendering, clear action, responsive overflow, console errors, and external requests.");
})().catch((error) => { console.error(error); server.close(); process.exit(1); });
