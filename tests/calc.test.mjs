// Runs the calculator's script from index.html in Node and checks known results.
// Run with: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx = vm.createContext({});
vm.runInContext(code + "\n;globalThis.api={blank,compute};", ctx);
const { blank, compute } = ctx.api;
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
