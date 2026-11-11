# jr1-salary

UK take-home pay calculator for tax year 2027/28, served at **https://salary.jr1.com**.

It shows pay after tax, National Insurance, pension and any other deductions, on one phone screen.

## Ethos

1. **Nothing is saved or sent.** No storage, cookies, analytics or network calls. The page's content security policy blocks them, and a test checks for them.
2. **One phone screen, no scrolling.** The main screen fits any phone. Everything else opens as a panel from the main screen.
3. **Quick.** Type a salary, read the answer. The answer sits at the top so it stays visible above the keyboard.
4. **Plain.** One HTML file, no build step, no packages at runtime.

## Files

- `index.html`: the whole app (HTML, CSS and JavaScript in one file).
- `fonts/`: IBM Plex Sans and Mono (SIL Open Font Licence), served from the site.
- `sw.js`, `site.webmanifest`, `icons/`: let the app be added to a phone's home screen and open with no signal. Only the app's own files are kept, never anything entered.
- `favicon.svg`, `404.html`, `CNAME`: site icon, not-found page and the custom domain for GitHub Pages.
- `tests/calc.test.mjs`: checks the tax maths against known results, and that the page stores and sends nothing.
- `tests/layout.check.cjs`: opens the app in a browser at nine phone sizes and fails if the main screen scrolls.
- `.github/workflows/pages.yml`: runs both on every push and pull request, and deploys `main` to GitHub Pages.

## Checks

```
npm test                 # tax maths and privacy; needs Node 20 or later, no packages
npm run check:layout     # phone-screen fit; needs Playwright (npx playwright install chromium)
```

## How the screen fits every phone

Every size in the CSS is in `rem`. `1rem` is set from the screen so the page is always 30rem wide and 53.4rem tall: 12px on a 360 x 640 screen, larger on bigger phones, smaller on shorter ones. Anything added to the main screen has to fit inside that box; `npm run check:layout` says by how much. On taller phones the spare height shows a bar for each month's take-home.

## Hosting

GitHub Pages, deployed by the workflow on every merge to `main`. DNS: a CNAME record for `salary` pointing to `jonrei.github.io`. To start a deploy by hand use **Run workflow** on the Actions page, not **Re-run jobs**.

## Updating the rates

Rates live in the `BANDS`, `NI`, `LOANS` and `CB` constants at the top of the script, and in the "Rates used" text in `update()`. UK income tax and NI thresholds for 2027/28 are confirmed unchanged. Scottish bands, Child Benefit and student loan thresholds are 2026/27 values and need updating when the 2027/28 figures are announced. Add a test for each change.

## Planned

A pension module: what the pot could be worth at a chosen retirement age, from a growth rate with conservative defaults, and the yearly and monthly income it could give with and without the State Pension.
