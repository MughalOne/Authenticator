# Zero‑Knowledge TOTP Generator & Password Generator

Generates 6‑digit TOTP codes and random passwords entirely on‑device. No storage, no permissions, no network.

## Features

### TOTP Generator
- Generate 6‑digit time‑based one‑time passwords (TOTP) from Base32 secrets
- Real‑time countdown timer with progress bar
- System clock display for time verification
- Show/Hide toggle for secret visibility
- One‑click copy to clipboard

### Password Generator
- Generate random passwords (4–64 characters)
- Customize character sets: Uppercase, Lowercase, Numbers, Symbols
- All generation happens locally—nothing is stored or transmitted

## Install

1. **Download & Extract**: Download the ZIP from GitHub and extract it, OR clone the repository:
   ```bash
   git clone https://github.com/MughalOne/Authenticator.git
   ```

2. **Open Extensions Manager**:
   - **Chrome**: Go to `chrome://extensions`
   - **Edge**: Go to `edge://extensions`
   - **Brave**: Go to `brave://extensions`

3. **Enable Developer Mode**: Toggle the **Developer mode** switch in the top right

4. **Load Extension**: Click **Load unpacked** and select the extracted folder

5. **Start Using**: Click the extension icon in your toolbar to open the popup

## Get Your Base32 Secret

Your TOTP secret is available from services that support two‑factor authentication:

- **GitHub**: Settings → Password and authentication → Two‑factor authentication → Recovery codes (or use authenticator app setup)
- **Google Account**: myaccount.google.com → Security → Two‑step verification
- **Microsoft**: account.microsoft.com → Security → Advanced security options
- Most other services provide the secret during 2FA setup (often as a QR code or text)

**Tip**: If you only have a QR code, use a QR decoder to extract the `secret=` parameter from the URL.

## Use

### TOTP Generator
1. Paste your Base32 secret (e.g., `JBSWY3DPEHPK3PXP`) into the input field
2. The 6‑digit code and countdown timer appear immediately
3. Code refreshes every 30 seconds
4. Click **Copy** to copy the code to clipboard
5. Click **Show/Hide** (👁) to reveal or mask the secret
6. Click **Reset** (✖) to clear the secret and start fresh
7. Close the popup to clear the secret from memory

### Password Generator
1. Click the **Password** tab
2. Set desired password length (4–64 characters)
3. Select character types: Uppercase, Lowercase, Numbers, Symbols
4. Click **Generate** to create a random password
5. Click **Copy** to copy to clipboard

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ v100+ | Full support |
| Edge    | ✅ v100+ | Full support |
| Brave   | ✅ v1.0+ | Full support |
| Firefox | ⚠️ Partial | Web Crypto supported; install as temporary extension |
| Safari  | ❌ Not supported | Safari extensions use different API |

## Security Design

- **Zero storage**: No `chrome.storage`, localStorage, or IndexedDB used
- **Zero permissions**: Extension requests no permissions and has no host access
- **No network**: Strict Content Security Policy (CSP) blocks all external connections
- **On‑device crypto**: Uses Web Crypto API (HMAC‑SHA1) per RFC 4226/6238
- **Ephemeral secret**: Secret exists only in popup memory; automatically cleared when popup closes
- **Minimal surface**: Popup‑only UI; no background/service worker

## Important Notes

- **System Time Matters**: TOTP codes depend on your device's system clock. If codes don't work, check that your system time is accurate (within 30 seconds)
- **No Backup**: This extension does not backup, sync, or store anything—by design
- **One Secret at a Time**: Enter one Base32 secret per popup; to switch, clear and enter a new secret
- **Standard TOTP Only**: Currently supports RFC 4226/6238 (30‑second period, HMAC‑SHA1, 6 digits). Custom algorithms (SHA‑256, SHA‑512, custom period) are not yet supported

## Troubleshooting

**Q: Codes don't match the expected code**
- Verify your system clock is synchronized. Open System Preferences/Settings and check the date/time.

**Q: "Invalid" error appears**
- Ensure the secret is valid Base32 (letters A–Z and numbers 2–7 only, uppercase or lowercase)

**Q: Secret still visible after closing the popup**
- Open the popup again and click **Reset** (✖) to manually clear the secret

## Notes

- If your issuer requires SHA‑256, SHA‑512, or custom periods, you can modify the `totp6()` function in `popup.js`
- Web Crypto HMAC‑SHA1 support is required and available in all modern browsers

---

**Privacy**: Your secrets never leave your device. This extension has no internet access and stores nothing.
