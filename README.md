# jr1-salary

UK take-home pay calculator, served at **https://salary.jr1.com**.

Two screens, swapped with the tabs at the top:

- **Take-home:** pay after tax, National Insurance, pension and any other deductions, for tax years 2025/26, 2026/27 and 2027/28.
- **Pension pot:** what the pot could be worth at a chosen retirement age, and the yearly and monthly income it could give, with or without the State Pension.

## Ethos

1. **Nothing is saved or sent.** No storage, cookies, analytics or network calls. The page's content security policy blocks them, and a test checks for them.
2. **One phone screen, no scrolling.** Each screen fits any phone. Everything else opens as a panel.
3. **Quick.** Type a salary, read the answer. The answer sits at the top so it stays visible above the keyboard.
4. **Plain.** One HTML file, no build step, no packages at runtime.

## Files

- `index.html`: the whole app (HTML, CSS and JavaScript in one file).
- `fonts/`: IBM Plex Sans and Mono (SIL Open Font Licence), served from the site.
- `sw.js`, `site.webmanifest`, `icons/`: let the app be added to a phone's home screen and open with no signal. Only the app's own files are kept, never anything entered.
- `favicon.svg`, `404.html`, `CNAME`: site icon, not-found page and the custom domain for GitHub Pages.
- `tests/calc.test.mjs`: checks the tax maths against known results, and that the page stores and sends nothing.
- `tests/layout.check.cjs`: opens the app in a browser at nine phone sizes and fails if either screen scrolls.
- `.github/workflows/pages.yml`: runs both on every push and pull request, and deploys `main` to GitHub Pages.

## Checks

```
npm test                 # tax maths and privacy; needs Node 20 or later, no packages
npm run check:layout     # phone-screen fit; needs Playwright (npx playwright install chromium)
```

## How the screen fits every phone

Every size in the CSS is in `rem`. `1rem` is set from the screen so the page is always 30rem wide and 53.4rem tall: 12px on a 360 x 640 screen, larger on bigger phones, smaller on shorter ones. Anything added to either screen has to fit inside that box; `npm run check:layout` says by how much. On taller phones the spare height shows a bar for each month's take-home.

## Hosting

GitHub Pages, deployed by the workflow on every merge to `main`. DNS: a CNAME record for `salary` pointing to `jonrei.github.io`. To start a deploy by hand use **Run workflow** on the Actions page, not **Re-run jobs**.

## Updating the rates

Rates for each tax year are in the `YEARS` table at the top of the script. Income tax outside Scotland (`RUK`) and National Insurance (`NI`) are the same in every year offered. The "Rates used" text is built from the table. To add a year, add an entry to `YEARS` and an option to the `year` select. 2027/28 uses the 2026/27 Scottish bands, Child Benefit and student loan thresholds until its own are announced; update its entry and `status` text when they are. Add a test for each change.

## Pension pot

`potCalc` compounds month by month: the pot grows, then the month's payment is added. Everything is in today's money, so the growth rate is the rate after price rises and charges. Defaults are cautious: 2% growth, 3.5% income a year, retire at 67. The State Pension default is the full new State Pension for 2026/27 (£241.30 a week); update `spWeekly` in `blank()` and the note in the State Pension panel each April. If the monthly payment is left empty, it uses the pension total from the Take-home screen.
