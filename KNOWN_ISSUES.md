# Known Issues & Tech Debt

Things that are **good enough for the MVP** but should be fixed before a wider/production release.

---

## 🔴 Venmo deep link only works reliably on iOS

**Where:** `components/splity/screens/SendScreen.tsx` → `handleVenmo()`

```js
const url = `venmo://paycharge?txn=pay&recipients=&amount=${amount}&note=${note}`;
window.open(url, "_blank");
```

`venmo://` is a custom URL scheme (an app deep link). It behaves very differently per platform:

| Platform | Behavior today |
|---|---|
| **iOS Safari / installed PWA** | Mostly works *if* Venmo is installed — but `window.open(scheme, "_blank")` is unreliable on iOS and inside a `display: standalone` PWA. The correct pattern is `window.location.href = url`. |
| **Android Chrome / PWA** | Bare `venmo://` is usually blocked (`net::ERR_UNKNOWN_URL_SCHEME`) or silently ignored. Android needs an `intent://` URI with `package=com.venmo` and a `browser_fallback_url`. `window.open` typically yields a blank/popup-blocked tab. |
| **Desktop browser / desktop PWA** | No `venmo://` handler exists (no desktop app). The scheme does nothing and `window.open("_blank")` leaves a dangling blank tab. Venmo's website does **not** honor `paycharge` prefill params, so there's no clean web fallback. |

**Net effect:** on anything that isn't iOS-with-the-app, the Venmo button does not meaningfully work and there is no fallback.

**Intended fix (post-MVP):**
- iOS → navigate with `window.location.href = url` instead of `window.open`.
- Android → build `intent://paycharge?...#Intent;scheme=venmo;package=com.venmo;S.browser_fallback_url=https%3A%2F%2Fvenmo.com;end`.
- Desktop → detect and skip the scheme; degrade to the Copy flow (or open `https://venmo.com`).
- Optionally use the `window.open` return value / a timeout to detect "nothing happened" and fall back.

**Related limitation:** `recipients=` is sent empty (Splity doesn't store Venmo handles), so even when the app opens, no payee is prefilled — the user picks the person manually. The spec in `CLAUDE.md` / prototype README assumes `recipients=@user`.

**Note:** `SendScreen` tests mock `window.open` in jsdom, so the green suite does not validate the deep link on any real platform — expected to be caught by the Phase 10 real-device E2E pass.
