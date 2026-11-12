# jr1-salary: JR1 Money

UK money calculators, served at **https://money.jr1.com**.

A front page lists the calculators. Each opens on its own screen with a "‹ Tools" button back to the front page:

- **Take-home pay:** pay after tax, National Insurance, pension and any other deductions, for tax years 2025/26, 2026/27 and 2027/28.
- **Pension pot:** the pot when drawdown starts, the income each drawdown rate gives and how long the pot lasts, with the State Pension as a tick box and a tax-free lump sum as an option.
- **Compound interest:** how savings grow from a starting amount and weekly or monthly payments.

## Ethos

1. **Your figures stay with you.** What a user enters is kept in their own browser, under one storage key, so it is there on the next visit. It is never sent anywhere. No cookies, analytics or network calls. The page's content security policy blocks sending data, and a test checks the rest.
2. **One phone screen, no scrolling.** Each screen fits any phone. Everything else opens as a panel.
3. **Quick.** Type a figure, read the answer. The answer sits at the top so it stays visible above the keyboard.
4. **Plain.** One HTML file, no build step, no packages at runtime.

## Files

- `index.html`: the whole app (HTML, CSS and JavaScript in one file).
- `fonts/`: IBM Plex Sans and Mono (SIL Open Font Licence), served from the site.
- `sw.js`, `site.webmanifest`, `icons/`: let the app be added to a phone's home screen and open with no signal. The service worker keeps only the app's own files.
- `favicon.svg`, `404.html`, `CNAME`: site icon, not-found page and the custom domain for GitHub Pages.
- `tests/calc.test.mjs`: checks the maths against figures worked out by hand, and that the page stores only its one key and sends nothing.
- `tests/layout.check.cjs`: opens the app in a browser at nine phone sizes and fails if any screen scrolls.
- `.github/workflows/pages.yml`: runs both on every push and pull request, and deploys `main` to GitHub Pages.

## Checks

```
npm test                 # maths and privacy; needs Node 20 or later, no packages
npm run check:layout     # phone-screen fit; needs Playwright (npx playwright install chromium)
```

## How the screen fits every phone

Every size in the CSS is in `rem`. `1rem` is set from the screen so the page is always 30rem wide and 53.4rem tall: 12px on a 360 x 640 screen, larger on bigger phones, smaller on shorter ones. Anything added to a screen has to fit inside that box. On each calculator one box stretches to use the spare height: the result and tax scale on Take-home pay, the chart on the other two.

## What is kept in the browser

The whole state (`S`) is saved to `localStorage` under the key `jr1-money` after every change and read back on load (`save` and `load` in the script). `load` only accepts fields it knows, of the right type. Nothing is written until something has been entered, and "Clear my figures" removes the key. To add a field, add it to `blank()`; if it is a choice from a list, add the list to `ENUMS`.

## Moving between screens

The address ends in `#take-home`, `#pension` or `#compound` for a calculator and nothing for the front page (`route` in the script). The phone's back button works, and a calculator can be bookmarked.

## Hosting

GitHub Pages, deployed by the workflow on every merge to `main`. DNS: a CNAME record for `money` pointing to `jonrei.github.io`. To start a deploy by hand use **Run workflow** on the Actions page, not **Re-run jobs**.

## Updating the rates

Rates for each tax year are in the `YEARS` table at the top of the script. Income tax outside Scotland (`RUK`) and National Insurance (`NI`) are the same in every year offered. The "Rates used" text is built from the table. To add a year, add an entry to `YEARS` and an option to the `year` select. 2027/28 uses the 2026/27 Scottish bands, Child Benefit and student loan thresholds until its own are announced; update its entry and `status` text when they are. Add a test for each change.

## Pension pot

`potCalc` works month by month in three stages: saving until retirement (the pot grows, then the payment is added), waiting until drawdown starts (growth only), and drawdown (growth, then a twelfth of the yearly income is taken). Everything is in today's money, so the growth rate is the rate after price rises and charges.

- **Defaults are cautious:** 2% growth, 3.5% drawdown, retire at 67.
- **Drawdown** cannot start before the normal minimum pension age (`minAccessAge`): 55, rising to 57 on 6 April 2028.
- **Tax-free lump sum:** up to 25% of the pot, capped at the Lump Sum Allowance (`LSA`, £268,275), taken at or before the drawdown age.
- **State Pension** default is the full new State Pension for 2026/27 (£241.30 a week). Update `spWeekly` in `blank()` and the note in the State Pension panel each April.
- **Monthly payment** carries over the pension total from Take-home pay (yours plus your employer's) and follows it until a figure is typed; emptying the field links it again.

## Compound interest

`ciCalc` compounds the yearly rate as often as interest is added (monthly, yearly or daily), then spreads that growth evenly over the payment periods (52 weeks or 12 months). Each period the balance earns interest, then the payment is added.
