# jr1-salary: the take-home pay calculator at salary.jr1.com

Read `README.md` first. It holds the ethos, the file list and how the screen is sized.

## Rules

- **Nothing is saved or sent.** No localStorage, cookies, analytics, third-party scripts or network calls. Do not weaken the content security policy in `index.html`.
- **Neither screen scrolls** on a phone (Take-home and Pension pot). Run `npm run check:layout` after any change to either; it must pass at every size. New inputs go in a panel opened from the screen unless Jon asks otherwise.
- **The goal is take-home pay** after tax, NI and deductions, quick to use on a phone. Do not add features that slow that down.
- **Pension pot defaults stay cautious** and every figure is in today's money. Say "estimate, not financial advice".
- One HTML file, no build step, no framework, no runtime packages. Sizes in `rem`, never `px`, except the 16px minimum on form fields.
- Every change to the tax maths needs a test in `tests/calc.test.mjs` with the expected figure worked out by hand.
- Meet WCAG AA contrast in light and dark mode.

## Working with Jon

- Jon works mostly from an Android phone. Keep replies short and plain, and show screenshots at phone size.
- Work on a branch and open a pull request against `main`. Do not push to `main`. Never force-push.
- British English, no em dashes, no hype words. The app is an estimate, not financial or tax advice; keep that wording.
- Do not put model identifiers in commits, pull requests or code.
