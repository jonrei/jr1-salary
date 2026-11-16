// Opens the app in a real browser at common phone sizes and checks the rules it is built on:
// the map and every page fit with no scrolling, the main section of each page shows everything without scrolling
// (tables and help scroll inside their own box), the page makes no requests outside the site, the only thing kept
// in the browser is the one "jr1-money" key, and a carried figure never changes the calculator it came from.
// Run with: npm run check:layout   (needs Playwright). Set SHOTS=some/folder to also save screenshots.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const TYPES = { ".html": "text/html", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".js": "text/javascript", ".webmanifest": "application/manifest+json" };
const SIZES = [[320, 568], [360, 560], [360, 640], [360, 700], [375, 667], [390, 664], [412, 780], [430, 800], [480, 900]];
// every calculator filled in, at its fullest: warnings, a bonus, a lump sum, a late State Pension, long figures
const FULL = { salary: 118000, eePct: 8, erPct: 6, bonusValue: 9000, bsType: "pct", bsValue: 20, loan: "p2", children: 2, pensionMode: "target", netTarget: 5100,
  sac: [{ name: "Cycle to work", amount: 1200, basis: "yearly" }], post: [{ name: "Union", amount: 150, basis: "monthly" }],
  cmpB: 131500, bgNeeds: 55, bgWants: 25, ppAge: 24, ppRetire: 60, ppPot: 1250000, ppMonthly: 8000, ppDraw: 4.5, ppDdAge: 58, spOn: true, spAge: 68, lsType: "max",
  ciStart: 125000, ciYears: 40, ciInfl: 2.5, sgTarget: 250000, sgYears: 12, mgPrice: 1450000, mgDeposit: 250000, mgRate: 5.4, mgYears: 30, mgOver: 500, sdBuyer: "extra",
  lnAmount: 25000, lnRate: 9.9, lnYears: 7, dbBalance: 12500, dbRate: 29.9, dbPay: 350, dbExtra: 100, dvMode: "director", dvDivs: 60000,
  cgSold: 480000, cgPaid: 210000, cgCosts: 9500, ihEstate: 2400000, ihKids: true, ihSpouse: true };

const fit = () => {
  const de = document.documentElement, d = document.getElementById("detail"), on = d.classList.contains("on"), box = (on ? d : document.getElementById("stage")).getBoundingClientRect();
  const pane = document.getElementById("dpane"), inner = pane && pane.classList.contains("scroll") ? pane : null;
  const out = [...(on ? d : document.getElementById("map")).querySelectorAll("*")].filter((e) => !(inner && inner.contains(e) && e !== inner) && !e.closest("svg") && e.offsetWidth > 0)
    .filter((e) => { const r = e.getBoundingClientRect(); return r.right > box.right + 0.5 || r.left < box.left - 0.5 || r.bottom > innerHeight + 0.5; }).map((e) => e.id || e.className || e.tagName);
  // text cut short inside a row of the main section
  const cut = on && !inner ? [...pane.querySelectorAll(".lab,.val,.k,.v,.nm,.bg")].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim().slice(0, 30)) : [];
  return { page: Math.max(de.scrollHeight - innerHeight, de.scrollWidth - innerWidth), detail: on ? d.scrollHeight - d.clientHeight : 0, pane: pane && !inner && on ? pane.scrollHeight - pane.clientHeight : 0,
    out: [...new Set(out)], cut, stored: Object.keys(localStorage).filter((k) => k !== "jr1-money").length + sessionStorage.length + document.cookie.length };
};

(async () => {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  }).listen(0);
  const origin = "http://127.0.0.1:" + server.address().port, url = origin + "/";
  const browser = await chromium.launch();
  const problems = [];
  const watch = (page, tag) => {
    page.on("console", (m) => { if (m.type() === "error") problems.push(`${tag}: console error: ${m.text()}`); });
    page.on("pageerror", (e) => problems.push(`${tag}: script error: ${e.message}`));
    page.on("request", (r) => { if (!r.url().startsWith(origin)) problems.push(`${tag}: request outside the site: ${r.url()}`); });
  };
  const report = (tag, m) => {
    if (m.page > 0) problems.push(`${tag}: the screen scrolls by ${m.page}px`);
    if (m.detail > 0) problems.push(`${tag}: the page is ${m.detail}px too tall`);
    if (m.pane > 0) problems.push(`${tag}: the main section is ${m.pane}px too tall`);
    if (m.out.length) problems.push(`${tag}: content runs off the screen (${m.out.slice(0, 5).join(", ")})`);
    if (m.cut.length) problems.push(`${tag}: text is cut short (${m.cut.slice(0, 5).join(" | ")})`);
    if (m.stored) problems.push(`${tag}: something was stored outside the one "jr1-money" key`);
  };
  for (const [w, h] of SIZES) for (const state of ["empty", "full"]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: process.env.SHOTS ? 2 : 1, reducedMotion: "reduce" });
    const tag = `${w}x${h} ${state}`; watch(page, tag);
    await page.goto(url);
    if (state === "full") { await page.evaluate((f) => { Object.assign(S, f); save(); }, FULL); await page.reload(); }
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150);
    report(`${tag} map`, await page.evaluate(fit));
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, `next-${w}x${h}-${state}-map.png`) });
    let count = 1;
    for (const hash of await page.evaluate(() => MODS.map((m) => m.hash))) {
      await page.evaluate((x) => { location.hash = x; }, hash); await page.waitForSelector("#detail.on");
      const tabs = await page.$$eval("#dtabs button", (b) => b.map((x) => x.textContent));
      for (let i = 0; i < tabs.length; i++) {
        if (i) await page.click(`#dtabs [data-tab="${i}"]`);
        await page.waitForTimeout(20);
        report(`${tag} ${hash} ${tabs[i]}`, await page.evaluate(fit)); count++;
        if (process.env.SHOTS && (i === 0 || state === "full")) await page.screenshot({ path: path.join(process.env.SHOTS, `next-${w}x${h}-${state}-${hash}-${tabs[i]}.png`) });
      }
      await page.evaluate(() => { location.hash = ""; }); await page.waitForSelector("#detail:not(.on)");
    }
    console.log(`${tag}: ${count} screens checked`);
    await page.close();
  }

  // ---- behaviour, at one size ----
  const page = await browser.newPage({ viewport: { width: 390, height: 664 }, reducedMotion: "reduce" }); watch(page, "behaviour");
  const need = (ok, what) => { if (!ok) problems.push(`behaviour: ${what}`); };
  const openPage = async (hash) => { await page.evaluate((x) => { location.hash = x; }, hash); await page.waitForSelector(hash ? "#detail.on" : "#detail:not(.on)"); };
  const type = async (id, text) => { await page.click(`[data-edit="${id}"]`); await page.fill(".inrow input", text); await page.keyboard.press("Enter"); };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("jr1-money") || "null"));
  await page.goto(url); await page.evaluate(() => document.fonts.ready);
  need((await state()) === null, "something was stored before anything was entered");
  await openPage("take-home"); await type("salary", "42000");
  need((await page.textContent("#dfig")).includes("£"), "typing a salary gave no take-home figure");
  need((await state()).salary === 42000, "the salary was not kept in the browser");
  await page.click('[data-step="salary"][data-d="1"]');
  need((await state()).salary === 43000, "the + button did not raise the salary");
  need(await page.evaluate(() => document.querySelector(".inrow input") === null && [...document.querySelectorAll(".val")].every((e) => e.tagName === "BUTTON")), "a typing field was left open");
  await openPage("budget");
  need(await page.$eval('[data-edit="bgIncome"]', (e) => e.classList.contains("carried") && e.textContent.includes("£")), "Budget did not carry the take-home figure");
  await type("bgIncome", "2000");
  let s = await state();
  need(s.bgIncome === 2000 && s.salary === 43000, "typing over a carried figure changed its source");
  await page.click('[data-rs="bgIncome"]');
  need((await state()).bgIncome === null, "the reset button did not put the carried figure back");
  await openPage(""); await page.reload(); await page.evaluate(() => document.fonts.ready);
  need((await page.textContent("#map .tile .bg")).includes("£"), "figures were not shown on the map after a reload");
  await page.goto(url + "#mortgage"); await page.waitForSelector("#detail.on");
  need((await page.textContent("#detail h1")) === "MORTGAGE", "opening a page by its address did not work");
  await page.goBack(); await page.waitForSelector("#detail:not(.on)");
  await page.close();

  // ---- the linking animation, with motion on ----
  const live = await browser.newPage({ viewport: { width: 390, height: 664 } }); watch(live, "animation");
  await live.goto(url); await live.evaluate(() => { Object.assign(S, { salary: 42000, ppAge: 35 }); save(); }); await live.reload();
  await live.evaluate(() => document.fonts.ready); await live.waitForTimeout(400);
  await live.click("#sim"); await live.waitForTimeout(700);
  const mid = await live.evaluate(() => ({ dim: document.querySelectorAll(".tile.dim").length, chips: document.querySelectorAll(".chip").length,
    lit: [...document.getElementById("fx").getContext("2d").getImageData(0, 0, 400, 400).data].some((x) => x > 0) }));
  need(mid.dim > 0, "panels outside the chain did not fade back during a change");
  need(mid.chips > 0, "no panel showed how far its figure moved");
  need(mid.lit, "nothing was drawn on the map canvas");
  await live.waitForTimeout(3500);
  need(await live.evaluate(() => document.querySelectorAll(".tile.dim,.chip").length === 0), "the map did not return to rest after a change");
  report("animation map", await live.evaluate(fit));
  await live.close();

  await browser.close(); server.close();
  if (problems.length) { console.error("\n" + problems.join("\n")); process.exit(1); }
  console.log("\nThe map and every page fit with no scrolling, make no outside requests and store nothing beyond the one key.");
})();
