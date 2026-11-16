# jr1-salary: JR1 Money, the money calculators at money.jr1.com

Read `README.md` first. It holds the ethos, the file list, how the screen is sized and how each calculator works.

## Rules

- **Figures stay in the user's browser and are never sent.** State is kept in `localStorage` under the one key `jr1-money`. No cookies, analytics, third-party scripts or network calls. Do not weaken the content security policy in `index.html`.
- **No screen scrolls** on a phone: the map, and the MAIN section of every page. Run `npm run check:layout` after any change to a screen; it must pass at every size. New inputs go in a further section (tab) of the page unless Jon asks otherwise. Tables and help scroll inside their own box.
- **Quick to use on a phone.** The answer sits at the top of each page. Do not add features that slow that down.
- **The look is the map:** a dark terminal style with green text, four territories, panels, routes and the linking animation. Jon chose it; do not restyle it or add a second view without being asked.
- **A new calculator** gets tested maths, an entry in `MODS`, a place in `ZONES`, notes in `NOTES` and figures in `FULL` in `tests/layout.check.cjs`. The README lists the steps.
- **Figures carry between calculators but never back.** A carried field stays `null` in the state and reads its figure through `eff(id, ctx)`. Setting it must never change the calculator it came from. New shared fields go in `LINK`.
- **Tax rules go out of date.** When touching a tax calculator, check its rates against GOV.UK and update `NOTES` to match.
- **Pension and savings defaults stay cautious.** Pension figures are in today's money. Say "estimate, not financial advice".
- **Animation is switched off for reduced motion.** Everything must still work and read correctly without it.
- One HTML file, no build step, no framework, no runtime packages. Sizes in `rem`, never `px`, except the 16px minimum on form fields and drawing on the canvas.
- Keep the maths above the `interface` comment in the script free of interface code. Every change to the maths needs a test in `tests/calc.test.mjs` with the expected figure worked out by hand.
- Meet WCAG AA contrast.

## Working with Jon

- Jon works mostly from an Android phone. Keep replies short and plain, and show screenshots at phone size.
- Work on a branch and open a pull request against `main`. Do not push to `main`. Never force-push.
- British English, no em dashes, no hype words. The app is an estimate, not financial or tax advice; keep that wording.
- Do not put model identifiers in commits, pull requests or code.
