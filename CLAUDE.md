# jr1-salary: JR1 Money, the money calculators at money.jr1.com

Read `README.md` first. It holds the ethos, the file list, how the screen is sized and how each calculator works.

## Rules

- **Figures stay in the user's browser and are never sent.** State is kept in `localStorage` under the one key `jr1-money`. No cookies, analytics, third-party scripts or network calls. Do not weaken the content security policy in `index.html`.
- **No screen scrolls** on a phone: the front page and every calculator. Run `npm run check:layout` after any change to a screen; it must pass at every size. New inputs go in a panel opened from the screen unless Jon asks otherwise.
- **Quick to use on a phone.** The answer sits at the top of each calculator. Do not add features that slow that down.
- **A new calculator** gets a row in `TOOLS`, tested maths, notes in `NOTES` and a state in `tests/layout.check.cjs`. The README lists the steps.
- **Figures carry between calculators but never back.** A carried field stays `null` in the state and reads its figure through `eff(id)`. Typing in it must never change the calculator it came from. New shared fields go in `CARRY` or `CARRYSEL`.
- **Tax rules go out of date.** When touching a tax calculator, check its rates against GOV.UK and update `NOTES` to match.
- **Pension and savings defaults stay cautious.** Pension figures are in today's money. Say "estimate, not financial advice".
- One HTML file, no build step, no framework, no runtime packages. Sizes in `rem`, never `px`, except the 16px minimum on form fields.
- Every change to the maths needs a test in `tests/calc.test.mjs` with the expected figure worked out by hand.
- Meet WCAG AA contrast in light and dark mode.

## Working with Jon

- Jon works mostly from an Android phone. Keep replies short and plain, and show screenshots at phone size.
- Work on a branch and open a pull request against `main`. Do not push to `main`. Never force-push.
- British English, no em dashes, no hype words. The app is an estimate, not financial or tax advice; keep that wording.
- Do not put model identifiers in commits, pull requests or code.
