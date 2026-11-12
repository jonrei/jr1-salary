// Runs the calculator's script from index.html in Node and checks known results.
// Run with: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx = vm.createContext({});
vm.runInContext(code + "\n;globalThis.api={blank,compute,potCalc,ciCalc,minAccessAge,lastsTo};", ctx);
const { blank, compute, potCalc, ciCalc, minAccessAge, lastsTo } = ctx.api;
const calc = (o) => compute(Object.assign(blank(), o));
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.01, `${msg}: got ${a}, expected ${b}`);

test("£30,000 in England, 5% salary sacrifice", () => {
  const C = calc({ salary: 30000, eePct: 5, erPct: 3 });
  // pay after sacrifice 28,500; tax 20% and NI 8% above 12,570
  near(C.R.sum("tax"), (28500 - 12570) * 0.2, "tax");
  near(C.R.sum("ni"), (28500 - 12570) * 0.08, "NI");
  near(C.net, 28500 - 3186 - 1274.4, "take-home");
});

test("no pension, no tax below the allowance", () => {
  const C = calc({ salary: 12000, eePct: 0, erPct: 0 });
  near(C.R.sum("tax"), 0, "tax");
  near(C.R.sum("ni"), 0, "NI");
  near(C.net, 12000, "take-home");
});

test("allowance is tapered above £100,000", () => {
  const C = calc({ salary: 110000, eePct: 0, erPct: 0 });
  near(C.R.allow, 12570 - 5000, "allowance");
});

test("take-home target solves a pension % that hits it", () => {
  const C = calc({ salary: 40000, pensionMode: "target", netTarget: 2300 });
  near(C.typical, 2300, "monthly take-home");
});

test("Scottish bands on £50,000", () => {
  const C = calc({ salary: 50000, region: "sco", eePct: 0, erPct: 0 });
  // 19% on 3,967, 20% on 12,989, 21% on 14,136, 42% on the last 6,338
  near(C.R.sum("tax"), 3967 * 0.19 + 12989 * 0.2 + 14136 * 0.21 + 6338 * 0.42, "tax");
});

test("NI drops to 2% above £50,270", () => {
  const C = calc({ salary: 60000, eePct: 0, erPct: 0 });
  near(C.R.sum("ni"), (50270 - 12570) * 0.08 + (60000 - 50270) * 0.02, "NI");
});

test("Plan 2 student loan is 9% above the threshold, rounded down each month", () => {
  const C = calc({ salary: 40000, eePct: 0, erPct: 0, loan: "p2" });
  near(C.R.sum("loan"), Math.floor((40000 - 29385) / 12 * 0.09) * 12, "loan");
});

test("a bonus is taxed with the rest of the year's pay", () => {
  const C = calc({ salary: 30000, eePct: 0, erPct: 0, bonusValue: 5000, bonusMonth: 12 });
  near(C.R.sum("tax"), (35000 - 12570) * 0.2, "tax");
});

test("Child Benefit charge is 1% for each £200 over £60,000", () => {
  const C = calc({ salary: 70000, eePct: 0, erPct: 0, children: 2 });
  near(C.R.cb, (27.05 + 17.9) * 52, "Child Benefit");
  near(C.R.charge, C.R.cb * 0.5, "charge");
});

test("deductions after tax reduce take-home and nothing else", () => {
  const base = calc({ salary: 30000 });
  const C = calc({ salary: 30000, post: [{ name: "Union", amount: 20, basis: "monthly" }] });
  near(C.R.sum("tax"), base.R.sum("tax"), "tax");
  near(C.net, base.net - 240, "take-home");
});

test("2025/26 uses that year's Scottish bands, student loan threshold and Child Benefit", () => {
  const C = calc({ year: "2025", salary: 50000, region: "sco", eePct: 0, erPct: 0, loan: "p2", children: 2 });
  // 19% on 2,827, 20% on 12,094, 21% on 16,171, 42% on the last 6,338
  near(C.R.sum("tax"), 2827 * 0.19 + 12094 * 0.2 + 16171 * 0.21 + 6338 * 0.42, "tax");
  near(C.R.sum("loan"), Math.floor((50000 - 28470) / 12 * 0.09) * 12, "loan");
  near(C.R.cb, (26.05 + 17.25) * 52, "Child Benefit");
});

test("2027/28 is the default year and uses the 2026/27 figures where none are set", () => {
  const o = { salary: 50000, region: "sco", eePct: 0, erPct: 0, loan: "p1", children: 1 };
  const a = calc(o), b = calc(Object.assign({ year: "2026" }, o));
  near(a.net, b.net, "take-home");
  near(a.R.cb, b.R.cb, "Child Benefit");
});

// The date is fixed so the minimum pension age does not depend on when the tests run.
const NOW = new Date(2026, 10, 12);
const pot = (o, monthly) => potCalc(Object.assign(blank(), o), monthly, NOW);

test("pension pot with no growth is the pot today plus what is paid in", () => {
  const P = pot({ ppAge: 50, ppRetire: 60, ppPot: 10000, ppGrowth: 0 }, 200);
  near(P.pot, 10000 + 200 * 12 * 10, "pot");
  near(P.growth, 0, "growth");
});

test("a pot with nothing paid in compounds yearly", () => {
  const P = pot({ ppAge: 50, ppRetire: 60, ppPot: 10000, ppGrowth: 5 }, 0);
  near(P.pot, 10000 * 1.05 ** 10, "pot");
});

test("monthly payments compound at the monthly rate", () => {
  const P = pot({ ppAge: 30, ppRetire: 60, ppPot: 0, ppGrowth: 3 }, 300);
  const i = 1.03 ** (1 / 12) - 1;
  assert.ok(Math.abs(P.pot - 300 * (1.03 ** 30 - 1) / i) < 0.5, `pot: got ${P.pot}`);
  near(P.paidIn, 300 * 12 * 30, "paid in");
});

test("income is the pot times the drawdown rate, plus the State Pension when ticked", () => {
  const P = pot({ ppAge: 50, ppRetire: 60, ppPot: 200000, ppGrowth: 0, ppDraw: 3.5, spOn: true, spWeekly: 241.3, spAge: 67 }, 0);
  near(P.income, 7000, "income from the pot");
  near(P.sp, 241.3 * 52, "State Pension");
  near(P.total, 7000 + 241.3 * 52, "total");
  assert.equal(P.spFrom, 67);
  const off = pot({ ppAge: 50, ppRetire: 60, ppPot: 200000, ppGrowth: 0, spOn: false }, 0);
  near(off.total, 7000, "total without State Pension");
});

test("the earliest pension age is 55 until 6 April 2028, then 57", () => {
  assert.equal(minAccessAge(40, NOW), 57, "aged 40: 55 falls after April 2028");
  assert.equal(minAccessAge(54, NOW), 55, "aged 54: 55 falls before April 2028");
  assert.equal(minAccessAge(56, NOW), 56, "aged 56 now");
  assert.equal(minAccessAge(62, NOW), 62, "already old enough");
  assert.equal(minAccessAge(55, new Date(2028, 3, 6)), 57, "aged 55 on the day the age rises");
});

test("drawdown cannot start before the earliest age, and can start after retiring", () => {
  const early = pot({ ppAge: 40, ppRetire: 50, ppPot: 100000, ppGrowth: 0 }, 0);
  assert.equal(early.dd, 57, "retiring at 50 still waits until 57");
  const late = pot({ ppAge: 50, ppRetire: 60, ppDdAge: 65, ppPot: 100000, ppGrowth: 5 }, 0);
  assert.equal(late.dd, 65);
  near(late.pot, 100000 * 1.05 ** 15, "pot keeps growing between retiring and drawdown");
});

test("the pot falls by the yearly income in drawdown and runs out when expected", () => {
  // no growth and 5% a year: the pot loses 5,000 a year and lasts 20 years
  const P = pot({ ppAge: 60, ppRetire: 60, ppPot: 100000, ppGrowth: 0, ppDraw: 5 }, 0);
  near(P.rows[1].pot, 95000, "pot a year into drawdown");
  near(P.rows[10].pot, 50000, "pot ten years in");
  assert.equal(P.lasts, 80, "runs out at 80");
  assert.equal(lastsTo(100000, 2, 3, 60), Infinity, "taking less than the growth never runs out");
});

test("the tax-free lump sum is a quarter of the pot, capped at £268,275", () => {
  const P = pot({ ppAge: 50, ppRetire: 60, ppPot: 200000, ppGrowth: 0, ppDraw: 4, lsType: "max" }, 0);
  near(P.lump, 50000, "lump sum");
  assert.equal(P.lumpAge, 60, "taken when drawdown starts unless an age is given");
  near(P.pot, 150000, "pot left");
  near(P.income, 6000, "drawdown is worked out on the pot left");
  const big = pot({ ppAge: 50, ppRetire: 60, ppPot: 2000000, ppGrowth: 0, lsType: "max" }, 0);
  near(big.lump, 268275, "capped at the Lump Sum Allowance");
  const part = pot({ ppAge: 50, ppRetire: 60, ppPot: 200000, ppGrowth: 0, lsType: "amount", lsAmount: 20000 }, 0);
  near(part.lump, 20000, "a smaller amount is taken as asked");
  const over = pot({ ppAge: 50, ppRetire: 60, ppPot: 200000, ppGrowth: 0, lsType: "amount", lsAmount: 90000 }, 0);
  near(over.lump, 50000, "an amount over the limit is cut back");
});

test("a lump sum age below the earliest allowed is moved up", () => {
  const P = pot({ ppAge: 40, ppRetire: 65, ppPot: 100000, ppGrowth: 0, lsType: "max", lsAge: 50 }, 0);
  assert.equal(P.lumpAge, 57);
  near(P.lump, 25000, "lump sum");
});

const ci = (o) => ciCalc(Object.assign(blank(), o));

test("compound interest on a lump sum, added yearly and monthly", () => {
  near(ci({ ciStart: 1000, ciRate: 5, ciYears: 10, ciComp: "yearly" }).bal, 1000 * 1.05 ** 10, "yearly");
  near(ci({ ciStart: 1000, ciRate: 5, ciYears: 10, ciComp: "monthly" }).bal, 1000 * (1 + 0.05 / 12) ** 120, "monthly");
});

test("monthly payments with interest added monthly", () => {
  const R = ci({ ciPay: 100, ciRate: 6, ciYears: 1, ciFreq: "monthly", ciComp: "monthly" });
  near(R.bal, 100 * (1.005 ** 12 - 1) / 0.005, "balance");
  near(R.paid, 1200, "paid in");
  near(R.interest, R.bal - 1200, "interest");
});

test("weekly payments are 52 a year", () => {
  const R = ci({ ciStart: 500, ciPay: 10, ciRate: 0, ciYears: 2, ciFreq: "weekly" });
  near(R.bal, 500 + 10 * 52 * 2, "balance with no interest");
});

test("the payment can rise each year, and the balance can be shown in today's money", () => {
  const R = ci({ ciPay: 100, ciRate: 0, ciYears: 2, ciRise: 10, ciInfl: 2 });
  near(R.bal, 1200 + 1320, "second year pays 10% more");
  near(R.real, 2520 / 1.02 ** 2, "today's money");
});

test("Cycle to Work entered as a yearly amount is spread over the whole tax year", () => {
  const base = calc({ salary: 30000, eePct: 0, erPct: 0 });
  const C = calc({ salary: 30000, eePct: 0, erPct: 0, sac: [{ name: "Cycle to Work", amount: 1200, basis: "yearly" }] });
  near(C.R.sum("sch"), 1200, "sacrificed in the year");
  near(C.R.rows[0].sch, 100, "sacrificed each month");
  // saves 20% tax and 8% NI on the 1,200
  near(C.net, base.net - 1200 * (1 - 0.28), "take-home");
});

test("the page keeps its promise: figures stay in the browser, nothing is sent, nothing is loaded from elsewhere", () => {
  for (const banned of ["sessionStorage", "indexedDB", "document.cookie", "fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket"])
    assert.ok(!code.includes(banned), `script uses ${banned}`);
  // browser storage is used through one key only
  const uses = code.match(/localStorage\.\w+\([^)]*/g) || [];
  assert.ok(uses.length > 0 && uses.every((u) => /^localStorage\.(getItem|setItem|removeItem)\(KEY/.test(u)), `unexpected storage use: ${uses.join(" | ")}`);
  const urls = html.match(/https?:\/\/[^\s"'<>)]+/g) || [];
  const outside = urls.filter((u) => !u.startsWith("https://money.jr1.com/"));
  assert.deepEqual(outside, [], "links to other sites");
  assert.match(html, /connect-src 'none'/, "content security policy blocks sending data");
});
