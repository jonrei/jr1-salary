# jr1-salary: JR1 Money

UK money calculators, served at **https://money.jr1.com**.

The app is one screen drawn as a map, in a dark terminal style with green text. Four territories hold a panel for each calculator, and routes join the panels that share figures. Tapping a panel zooms into its page. A change in one calculator runs along the routes and updates the panels it feeds.

| Territory | Calculators |
|---|---|
| Pay | Take home, Compare, Convert, Budget |
| Saving | Pension, Compound, Goal |
| Home and borrowing | Stamp duty, Mortgage, Loan, Debt |
| Tax | Inheritance tax, Capital gains, Self-employed |

## Ethos

1. **Your figures stay with you.** What a user enters is kept in their own browser, under one storage key, so it is there on the next visit. It is never sent anywhere. No cookies, analytics or network calls. The page's content security policy blocks sending data, and a test checks the rest.
2. **One phone screen, no scrolling.** The map and the main section of every page fit any phone. Other inputs sit in further sections of the page. Tables and help scroll inside their own box.
3. **Quick.** Tap a figure, type, read the answer. The answer sits at the top of the page.
4. **Plain.** One HTML file, no build step, no packages at runtime.

## Files

- `index.html`: the whole app (HTML, CSS and JavaScript in one file).
- `next.html`: sends old links to the map view on to the main page.
- `fonts/`: IBM Plex Mono (SIL Open Font Licence), served from the site.
- `sw.js`, `site.webmanifest`, `icons/`: let the app be added to a phone's home screen and open with no signal. The service worker keeps only the app's own files.
- `favicon.svg`, `404.html`, `CNAME`: site icon, not-found page and the custom domain for GitHub Pages.
- `tests/calc.test.mjs`: checks the maths against figures worked out by hand, that carried figures follow their source, and that the page stores only its one key and sends nothing.
- `tests/layout.check.cjs`: opens the app in a browser at nine phone sizes, empty and full, and fails if the map or any section of any page does not fit. It also checks typing, carrying, reset, reload and the linking animation.
- `.github/workflows/pages.yml`: runs both on every push and pull request, and deploys `main` to GitHub Pages.

## Checks

```
npm test                 # maths and privacy; needs Node 20 or later, no packages
npm run check:layout     # phone-screen fit and behaviour; needs Playwright (npx playwright install chromium)
```

## How the script is laid out

The script in `index.html` has two parts, split by the comment `/* ---------- interface: the map and its pages ---------- */`.

- **Before it: the maths.** Plain functions with no interface code: the tax tables (`YEARS`, `RUK`, `NI`, `SD`, `DIV`), `blank()` for an empty state, and a function for each calculator (`compute`, `potCalc`, `ciCalc`, `mortgageCalc` and so on). The tests load these.
- **After it: the interface.** `MODS` lists each calculator: its name on the map, the question it answers, its sections (tabs) and fields, and a `calc` that returns the figures to show. `model()` runs every `calc` in order. `LINK` lists the carried fields.

To add a calculator: write its maths as a plain function with tests, add an entry to `MODS`, a place for it in `ZONES`, notes in `NOTES`, and figures for it in `FULL` in `tests/layout.check.cjs`.

## How the screen fits every phone

Every size in the CSS is in `rem`. `1rem` is set from the screen so the page is always 30rem wide: 12px on a 360px-wide screen, larger on bigger phones, smaller on shorter ones. The map is a grid that fills the space it is given. On a page, the MAIN section must fit without scrolling: keep it to about five inputs and five results. A page with more than four linked pages shows them as small buttons.

## What is kept in the browser

The whole state (`S`) is saved to `localStorage` under the key `jr1-money` after every change and read back on load (`save` and `load`). `load` only accepts fields it knows, of the right type. Nothing is written until something has been entered. "Clear all my figures", in the HELP section of every page, removes the key. To add a field, add it to `blank()`; if it is a choice from a list, add the list to `ENUMS`.

## Figures carried between calculators

A field can show a figure from another calculator until the user sets their own. It has a dashed underline while it is carried, and a line under its label says where it comes from. Setting it changes that calculator only and never alters the source. A ↺ button puts the carried figure back; emptying the field does the same.

| Field | Carried from |
|---|---|
| Pension: paid in a month | Take home: your pension plus your employer's |
| Compare: salary now | Take home: salary |
| Convert: pay | Take home: salary, shown for the chosen period |
| Budget: income a month | Take home: a normal month's take-home |
| Self-employed: director's salary, tax year, region | Take home |
| Capital gains: your income | Take home: income counted for tax |
| Compound: regular payment | Budget: the amount to save |
| Goal: have now, interest rate | Compound |
| Mortgage: property price | Stamp duty, and the other way round |
| Stamp duty: where | Take home: tax region |
| Inheritance tax: home value | Mortgage: property price |

The table lives in `LINK`. A carried field is `null` in the state; `eff(id, ctx)` gives the figure in use. To carry a new field, add it to `LINK` with the calculator it comes from and a function that returns the figure. The routes on the map are drawn from `LINK`, so a new link gets its route without more work.

## The map and its movement

- `ZONES` places each panel on a four-by-four board, two-by-two for each territory. `wires()` draws the routes through the gaps between panels so they never cross one.
- Movement is drawn on a canvas over the map (`fxFrame`). At rest two dots circle each territory. When a figure changes, `spread` works out which routes the change travels and when it reaches each panel. One dot runs down each line and splits where routes part, the route stays lit until the chain has finished, panels outside the chain fade back, and each panel reached shows a badge with how far its figure moved (`surge`).
- The same animation, without badges or fading, plays at start-up and on returning to the map (`ripple`).
- A page opens with the lit frame of the panel that was tapped, which dims after a few seconds to a faint green glow. Faint green characters fall behind the page (`rain`), drawn on a canvas under its content while the page is open. The same falls across the map (`mapRain`) at the size it would be if a page were shrunk back into its panel, so the two match through the zoom.
- With reduced motion set on the phone, none of this moves: the territory borders are solid, the page frame is dim from the start and the characters behind a page are still.

## Moving between screens

The address ends in `#` and the calculator's address (`#take-home`, `#mortgage` and so on), and in nothing for the map (`route`). The phone's back button returns to the map, and a page can be bookmarked.

## Hosting

GitHub Pages, deployed by the workflow on every merge to `main`. DNS: a CNAME record for `money` pointing to `jonrei.github.io`. To start a deploy by hand use **Run workflow** on the Actions page, not **Re-run jobs**.

## Updating the rates

Rates for each tax year are in the `YEARS` table at the top of the script. Income tax outside Scotland (`RUK`) and National Insurance (`NI`) are the same in every year offered. To add a year, add an entry to `YEARS`. 2027/28 uses the 2026/27 Scottish bands, Child Benefit and student loan thresholds until its own are announced; update its entry and `status` text when they are. Add a test for each change.

## Pension

`potCalc` works month by month in three stages: saving until retirement (the pot grows, then the payment is added), waiting until drawdown starts (growth only), and drawdown (growth, then a twelfth of the yearly income is taken). Everything is in today's money, so the growth rate is the rate after price rises and charges.

- **Defaults are cautious:** 2% growth, 3.5% drawdown, retire at 67.
- **RATES section:** four drawdown rates, half a point apart, with the chosen rate second.
- **YEARS section:** every year (`drawdownYears`): what comes from the pot, the State Pension from the age it starts, income tax, the amount after tax and the pot left. Tax uses the year and region set in Take home. A quarter of each withdrawal is tax free unless a lump sum has used the tax-free cash. No National Insurance is charged on pension income.
- **Drawdown** can start from the normal minimum pension age (`minAccessAge`): 55, rising to 57 on 6 April 2028. It defaults to the retirement age and can be earlier; the monthly payment then carries on until retirement.
- **Tax relief limits** are applied to what is paid in (`AA`, `MPAA`, `annualAllowance`, `pensionLimits`): the £60,000 annual allowance, counting the employer's payments; its taper for incomes over £260,000, down to £10,000, when a salary is entered in Take home; no more than the year's pay plus the employer's payments; and £10,000 a year once drawdown income is taken. Carry forward of unused allowance is not included. Take home warns when the year's payments go over the allowance.
- **Tax-free lump sum:** up to 25% of the pot, capped at the Lump Sum Allowance (`LSA`, £268,275), taken at or before the drawdown age.
- **State Pension** default is the full new State Pension for 2026/27 (£241.30 a week). Update `spWeekly` in `blank()` each April.

## The other calculators

- **Compound** (`ciCalc`) compounds the yearly rate as often as interest is added, then spreads that growth evenly over the payment periods. Each period the balance earns interest, then the payment is added. **Goal** is the same sum worked backwards (`goalCalc`).
- **Compare** and **Convert** run the Take home sum with a different salary, so they follow every Take home setting.
- **Mortgage**, **Loan** and **Debt** share `payDown`, which pays a balance down month by month. A mortgage charges a twelfth of its yearly rate each month; a loan or card uses the monthly rate that compounds to its APR.
- **Stamp duty** covers England and Northern Ireland, Scotland (LBTT) and Wales (LTT), with first-home relief and the extra-home rates. The bands are in `SD`.
- **Self-employed** covers a sole trader (income tax and Class 4) and a company director (salary plus dividends). Dividend rates for each year are in `DIV`.
- **Capital gains** uses the £3,000 allowance and the 18% and 24% rates. **Inheritance tax** uses the £325,000 allowance, the £175,000 home allowance with its taper, and a late spouse's allowances.

These tax rules change. Check `SD`, `DIV`, the Class 4 rates and the capital gains and inheritance figures against GOV.UK each April and after each Budget, and update the matching text in `NOTES`.

## Not yet in the app

Charts, and a named list for after-tax deductions (one monthly total for now). Salary sacrifice has a line for each common scheme (`SCHEMES`) and one for anything else, in the SACRIFICE section of Take home.
