# jr1-salary: JR1 Money

UK money calculators, served at **https://money.jr1.com**.

The front page lists every calculator, in groups, with the last figure worked out in each. Each opens on its own screen with a "‹ Tools" button back to the front page.

| Group | Calculators |
|---|---|
| Pay | Take-home pay, Compare salaries, Pay converter, Budget |
| Saving and retirement | Pension pot, Compound interest, Savings goal |
| Home and borrowing | Mortgage, Stamp duty, Loan, Debt payoff |
| Tax | Self-employed (sole trader or dividends), Capital gains, Inheritance tax |

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

## Figures carried between calculators

A field can show a figure from another calculator until the user types their own. It has a dashed box while it is carried, and a line under the inputs says where it came from. Typing changes it in that calculator only and never alters the source. Emptying the field links it again.

| Field | Carried from |
|---|---|
| Pension pot: paid in a month | Take-home pay: your pension plus your employer's |
| Compare salaries: salary now | Take-home pay: salary |
| Pay converter: pay | Take-home pay: salary, shown for the chosen period |
| Budget: monthly income | Take-home pay: a normal month's take-home |
| Self-employed: director's salary, tax year, region | Take-home pay |
| Capital gains: your income | Take-home pay: income counted for tax |
| Compound interest: regular payment | Budget: the amount to save |
| Savings goal: have now, interest rate | Compound interest |
| Mortgage: property price | Stamp duty, and the other way round |
| Stamp duty: where | Take-home pay: tax region |
| Inheritance tax: home value | Mortgage: property price |

The table lives in `CARRY` (number fields) and `CARRYSEL` (choices from a list) in the script. A carried field is `null` in the state; `eff(id)` gives the figure in use. To carry a new field, add it to `CARRY` with where it comes from and a function that returns the figure.

## Moving between screens

`TOOLS` in the script lists every calculator: its key, address, name, one-line description and screen. The front page is built from it. The address ends in `#` and the calculator's address (`#take-home`, `#mortgage` and so on) and in nothing for the front page (`route` in the script). The phone's back button works, and a calculator can be bookmarked.

To add a calculator: write its maths as a plain function with tests, add its screen, an `update` function, a row in `TOOLS`, notes in `NOTES` for the "How it works" panel, and a state in `tests/layout.check.cjs`.

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

## The other calculators

Each has a plain function for its maths, tested in `tests/calc.test.mjs`, and notes on its rules in `NOTES`, shown by the "How it works" button.

- **Compare salaries** and **Pay converter** run the Take-home pay sum with a different salary, so they follow every Take-home setting.
- **Mortgage**, **Loan** and **Debt payoff** share `payDown`, which pays a balance down month by month. A mortgage charges a twelfth of its yearly rate each month; a loan or card uses the monthly rate that compounds to its APR.
- **Savings goal** is the compound interest sum worked backwards (`goalCalc`).
- **Stamp duty** covers England and Northern Ireland, Scotland (LBTT) and Wales (LTT), with first-home relief and the extra-home rates. The bands are in `SD`.
- **Self-employed** covers a sole trader (income tax and Class 4) and a company director (salary plus dividends). Dividend rates for each year are in `DIV`.
- **Capital gains** uses the £3,000 allowance and the 18% and 24% rates. **Inheritance tax** uses the £325,000 allowance, the £175,000 home allowance with its taper, and a late spouse's allowances.

These tax rules change. Check `SD`, `DIV`, the Class 4 rates and the capital gains and inheritance figures against GOV.UK each April and after each Budget, and update the matching text in `NOTES`.
