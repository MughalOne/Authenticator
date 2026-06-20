# Zero‑Knowledge TOTP Generator

Generates 6‑digit TOTP codes from a Base32 secret entirely on‑device. No storage, no permissions, no network.

## Install
1. Download the ZIP and extract it OR clone the repository.
2. Open to Extenstions manager or go to `brave://extensions` (or `chrome://extensions`), enable **Developer mode**.
3. Click **Load unpacked** and select the extracted folder.

## Use
- Paste your Base32 secret in the field (e.g., `JBSWY3DPEHPK3PXP`).
- The 6‑digit code and a countdown appear immediately.
- Click **Copy code** to copy only the one‑time code.
- Close the popup to clear the secret from memory, or press ✖ to clear manually.

## Security design
- **Zero storage**: no `chrome.storage`, no localStorage, no IndexedDB.
- **Zero permissions**: the extension requests no permissions and has no host access.
- **No network**: strict CSP and no fetch/XHR.
- **On‑device crypto**: uses Web Crypto (HMAC‑SHA1) per RFC 4226/6238.
- **Ephemeral secret**: secret lives only in memory of the popup page and is cleared on close.
- **Minimal surface**: popup‑only UI; no background/service worker.

> Important: Web Crypto HMAC‑SHA1 is supported in modern Chromium browsers and remains required for TOTP/HOTP compatibility. Your issuer's secret must be Base32 (RFC 4648).

## Notes
- Time-based codes depend on your system time; ensure your clock is reasonably accurate.
- This does **not** backup or sync anything by design.
- If your issuer requires SHA‑256 or SHA‑512 with custom period/digits, you could extend `totp6()` accordingly.
