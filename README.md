# SurakshaOne

Fast, mobile-first cyber-fraud evidence assistant for UPI transaction screenshots.

> **Safety:** Hackathon/demo application. It does not submit complaints, freeze bank accounts, contact NPCI, or call 1930 automatically. It prepares evidence and offers a user-triggered phone link.

## Features

- Upload JPG, PNG, WEBP, or GIF payment proof.
- Crop and compress image in browser.
- Extract UTR/RRN, payee VPA, amount, timestamp, and fraud type.
- Run offline in `DEMO_MODE` with no API credits.
- Simulated dispatch receipt and lightweight PWA shell.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Offline demo: set `DEMO_MODE=true` and leave `OPENAI_API_KEY` empty. Real Vision mode requires a server-side key with credits.

## Verify

```bash
npm run build
npx playwright test --config=tests/playwright.config.ts
```

Test slow 3G, offline cache, mobile viewports, invalid files, API errors, installability, and accessibility.

## Architecture

```text
app/page.tsx                 Citizen workflow UI
app/components/ImageEditor   Browser crop/compression seam
app/api/claim                 Thin HTTP adapter
lib/claim-intake.ts          Vision/demo adapters + schema
lib/citizen-workflow.ts      Deterministic workflow transitions
lib/platform-policy.ts       Shared security policy
public/                      PWA manifest, icon, service worker
tests/                       API and Playwright coverage
```

Keep real victim data and API keys out of issues, logs, and commits. See [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).
