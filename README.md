# jr1-salary

UK take-home pay calculator for tax year 2027/28, served at **https://salary.jr1.com**.

## Files

- `index.html`: the whole app (HTML, CSS and JavaScript in one file). No build step, no server code.
- `fonts/`: IBM Plex Sans and Mono (SIL Open Font Licence), served from the site so the page makes no third-party requests.
- `favicon.svg`, `CNAME`: site icon and the custom domain for GitHub Pages.
- `tests/calc.test.mjs`: checks the tax maths against known results. Run `npm test` (Node 20 or later, no packages needed).
- `.github/workflows/pages.yml`: runs the tests on every push and pull request, and deploys `main` to GitHub Pages.

## Hosting on GitHub Pages

1. In the repository: Settings > Pages > Source: **GitHub Actions**.
2. DNS for jr1.com: add a CNAME record, host `salary`, pointing to `jonrei.github.io`.
3. Back in Settings > Pages, set the custom domain to `salary.jr1.com` (the `CNAME` file does this too) and tick **Enforce HTTPS** once the certificate is issued.

Any other static host also works: upload `index.html`, `favicon.svg` and `fonts/`.

## Rules for further work

- Nothing the user enters is stored or sent: no localStorage, cookies, analytics or network calls. Keep it that way.
- Layout is a fixed single phone screen (tested at 360 x 640); extra inputs open as overlay panels.
- Tax is calculated month by month on the cumulative PAYE basis. Rates live in the `BANDS`, `NI`, `LOANS` and `CB` constants at the top of the script.
- UK income tax and NI thresholds for 2027/28 are confirmed unchanged. Scottish bands, Child Benefit and student loan thresholds are 2026/27 values and need updating when the 2027/28 figures are announced.
- Run `npm test` before pushing.
