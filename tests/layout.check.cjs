// Opens the app in a real browser at common phone sizes and checks the rules it is built on:
// the main screen fits with no scrolling in either direction, the page makes no requests
// outside the site, and nothing is written to browser storage.
// Run with: npm run check:layout   (needs Playwright: npx playwright install chromium)
// Set SHOTS=some/folder to also save a screenshot of each size.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const TYPES = { ".html": "text/html", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".js": "text/javascript", ".webmanifest": "application/manifest+json" };
const SIZES = [[320, 568], [360, 560], [360, 640], [360, 700], [375, 667], [390, 664], [412, 780], [430, 800], [480, 900]];

// States to check: empty, a plain salary, the fullest Take-home screen (every legend row, a warning and a solved target),
// and the Pension pot screen empty and with everything filled in.
const STATES = {
  empty: async () => {},
  simple: async (p) => { await p.fill("#salary", "42000"); },
  full: async (p) => {
    await p.fill("#salary", "118000");
    await p.click('[data-open="shBonus"]'); await p.fill("#bonusValue", "9000"); await p.click("#shBonus .done");
    await p.click('[data-open="shSac"]'); await p.click("#addC2W"); await p.fill("#sac0a", "1200"); await p.click("#shSac .done");
    await p.click('[data-open="shPost"]'); await p.click("#addPost"); await p.fill("#post0a", "150"); await p.click("#shPost .done");
    await p.click('[data-open="shMore"]'); await p.selectOption("#loan", "p2"); await p.fill("#children", "2"); await p.click("#shMore .done");
    await p.fill("#netTarget", "5100"); await p.click("#optBtn");
  },
  potEmpty: async (p) => { await p.click("#tabPot"); },
  potFull: async (p) => {
    await p.fill("#salary", "118000"); await p.click("#tabPot");
    await p.fill("#ppAge", "24"); await p.fill("#ppRetire", "60"); await p.fill("#ppPot", "1250000"); await p.fill("#ppMonthly", "2500");
    await p.click('[data-open="shSP"]'); await p.fill("#spAge", "68"); await p.click("#shSP .done");
  },
};

(async () => {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  }).listen(0);
  const origin = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch();
  const problems = [];
  for (const [w, h] of SIZES) for (const [name, setup] of Object.entries(STATES)) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: process.env.SHOTS ? 2 : 1 });
    const tag = `${w}x${h} ${name}`;
    page.on("console", (m) => { if (m.type() === "error") problems.push(`${tag}: console error: ${m.text()}`); });
    page.on("pageerror", (e) => problems.push(`${tag}: script error: ${e.message}`));
    page.on("request", (r) => { if (!r.url().startsWith(origin)) problems.push(`${tag}: request outside the site: ${r.url()}`); });
    await page.goto(origin + "/");
    await setup(page);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const app = document.getElementById("app"), right = app.getBoundingClientRect().right;
      const wide = [...app.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().right > right + 0.5).map((e) => e.id || e.className || e.tagName);
      const scr = app.querySelector(".screen:not([hidden])"), kids = [...scr.children].filter((e) => e.offsetHeight > 0);
      const spare = scr.clientHeight - kids.reduce((t, e) => t + e.offsetHeight, 0) - parseFloat(getComputedStyle(scr).rowGap) * (kids.length - 1);
      return { spare: Math.round(spare), bars: !document.getElementById("months").hidden && scr.id === "scPay", over: app.scrollHeight - app.clientHeight, side: document.documentElement.scrollWidth - innerWidth, wide,
        stored: localStorage.length + sessionStorage.length + document.cookie.length, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) };
    });
    if (m.over > 0) problems.push(`${tag}: main screen is ${m.over}px too tall, so it scrolls`);
    if (m.side > 0 || m.wide.length) problems.push(`${tag}: content runs off the side (${m.wide.join(", ") || m.side + "px"})`);
    if (m.stored) problems.push(`${tag}: something was written to browser storage`);
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, `${w}x${h}-${name}.png`) });
    console.log(`${tag}: ${m.over > 0 ? "TOO TALL by " + m.over + "px" : "fits, " + m.spare + "px spare"}${m.bars ? ", month bars shown" : ""} (1rem = ${m.rem.toFixed(1)}px)`);
    await page.close();
  }
  await browser.close(); server.close();
  if (problems.length) { console.error("\n" + problems.join("\n")); process.exit(1); }
  console.log("\nAll sizes fit with no scrolling, no outside requests and nothing stored.");
})();
