/* Minimal Browser Extension Popup UI
   - TOTP Generator (RFC 6238, HMAC-SHA1, 30s period)
   - Password Generator
   - No storage, all computation happens locally
*/

// ===== TOTP IMPLEMENTATION =====

// Base32 decode (RFC 4648, uppercase, ignore padding & spaces)
function base32ToBytes(b32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let clean = b32.toUpperCase().replace(/\s+/g,'').replace(/=+$/,'');
  let bits = '';
  for (let ch of clean) {
    const val = alphabet.indexOf(ch);
    if (val === -1) continue; // ignore non‑alphabet characters
    bits += val.toString(2).padStart(5,'0');
  }
  const bytes = [];
  for (let i=0; i+8<=bits.length; i+=8) {
    bytes.push(parseInt(bits.slice(i,i+8),2));
  }
  return new Uint8Array(bytes);
}

// HOTP: Truncate per RFC 4226
function dynamicTruncate(hmac) {
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return bin;
}

// HMAC‑SHA1 via Web Crypto
async function hmacSha1(keyBytes, msgBytes) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes);
  return new Uint8Array(sig);
}

// Convert counter (8‑byte big‑endian) to ArrayBuffer
function counterToBytes(counter) {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // high 32
  view.setUint32(0, Math.floor(counter / 0x100000000));
  // low 32
  view.setUint32(4, counter >>> 0);
  return new Uint8Array(buf);
}

// TOTP 6‑digit with 30s period and T0=0
async function totp6(secretB32, timestampMs = Date.now(), period = 30) {
  const key = base32ToBytes(secretB32);
  if (!key.length) throw new Error('Invalid secret');
  const counter = Math.floor(timestampMs / 1000 / period);
  const msg = counterToBytes(counter);
  const hmac = await hmacSha1(key, msg);
  const bin = dynamicTruncate(hmac);
  const otp = (bin % 1_000_000).toString().padStart(6, '0');
  const remaining = period - (Math.floor(timestampMs/1000) % period);
  return { otp, remaining };
}

// ===== PASSWORD GENERATOR =====

function generatePassword(length, options) {
  const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };
  
  // Create character pool based on selected options
  let charPool = '';
  for (const [key, value] of Object.entries(options)) {
    if (value && charSets[key]) {
      charPool += charSets[key];
    }
  }
  
  // Ensure at least one character set is selected
  if (!charPool) {
    charPool = charSets.lowercase; // Default to lowercase if nothing selected
  }
  
  // Generate password
  let password = '';
  const charPoolLength = charPool.length;
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    password += charPool[randomValues[i] % charPoolLength];
  }
  
  return password;
}

// ===== UI ELEMENTS =====

// Common elements
const $ = (id) => document.getElementById(id);

// TOTP elements
const secretEl = $('secret');
const codeEl = $('code');
const remainingEl = $('remaining');
const progressBarEl = $('progress-bar');
const copyTotpBtn = $('copy-totp');
const generateTotpBtn = $('generate-totp');
const resetTotpBtn = $('reset-totp');
const toggleBtn = $('toggle');
const clearBtn = $('clear');
const clockEl = $('clock');

// Password elements
const passwordLengthEl = $('password-length');
const uppercaseEl = $('uppercase');
const lowercaseEl = $('lowercase');
const numbersEl = $('numbers');
const symbolsEl = $('symbols');
const passwordEl = $('password');
const generatePasswordBtn = $('generate-password');
const copyPasswordBtn = $('copy-password');

// Navigation elements
const totpScreenEl = $('totp-screen');
const passwordScreenEl = $('password-screen');
const navTotpBtn = $('nav-totp');
const navPasswordBtn = $('nav-password');

// ===== TOTP FUNCTIONALITY =====

let totpTimer = null;
let visible = false;

function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString();
}

async function updateTotpDisplay() {
  const secret = secretEl.value.trim();
  updateClock();
  
  if (!secret) {
    codeEl.textContent = '••••••';
    remainingEl.textContent = '--';
    remainingEl.classList.remove('low');
    progressBarEl.style.transform = 'scaleX(0)';
    copyTotpBtn.disabled = true;
    return;
  }
  
  try {
    const now = Date.now();
    const { otp, remaining } = await totp6(secret, now);
    codeEl.textContent = otp;
    remainingEl.textContent = remaining.toString();
    
    // Update progress bar
    const progress = remaining / 30;
    progressBarEl.style.transform = `scaleX(${progress})`;
    
    // Add pulse animation when time is running low
    if (remaining <= 10) {
      remainingEl.classList.add('low');
    } else {
      remainingEl.classList.remove('low');
    }
    
    copyTotpBtn.disabled = false;
  } catch (e) {
    codeEl.textContent = 'Invalid';
    remainingEl.textContent = '--';
    remainingEl.classList.remove('low');
    progressBarEl.style.transform = 'scaleX(0)';
    copyTotpBtn.disabled = true;
  }
}

function startTotpTimer() {
  stopTotpTimer();
  updateTotpDisplay();
  totpTimer = setInterval(updateTotpDisplay, 500);
}

function stopTotpTimer() {
  if (totpTimer) {
    clearInterval(totpTimer);
    totpTimer = null;
  }
}

// ===== PASSWORD FUNCTIONALITY =====

function generateAndDisplayPassword() {
  const length = parseInt(passwordLengthEl.value, 10) || 16;
  const options = {
    uppercase: uppercaseEl.checked,
    lowercase: lowercaseEl.checked,
    numbers: numbersEl.checked,
    symbols: symbolsEl.checked
  };
  
  const password = generatePassword(length, options);
  passwordEl.textContent = password;
  copyPasswordBtn.disabled = false;
}

// ===== COPY FUNCTIONALITY =====

async function copyToClipboard(text, button, originalText = 'Copy') {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 1000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}

// ===== SCREEN SWITCHING =====

function showScreen(screenId) {
  // Hide all screens
  totpScreenEl.classList.remove('active');
  passwordScreenEl.classList.remove('active');
  
  // Deactivate all nav buttons
  navTotpBtn.classList.remove('active');
  navPasswordBtn.classList.remove('active');
  
  // Show selected screen and activate corresponding nav button
  if (screenId === 'totp') {
    totpScreenEl.classList.add('active');
    navTotpBtn.classList.add('active');
    startTotpTimer(); // Start TOTP timer when showing TOTP screen
  } else if (screenId === 'password') {
    passwordScreenEl.classList.add('active');
    navPasswordBtn.classList.add('active');
    stopTotpTimer(); // Stop TOTP timer when not on TOTP screen
  }
}

// ===== EVENT LISTENERS =====

// TOTP event listeners
generateTotpBtn.addEventListener('click', () => {
  updateTotpDisplay();
});

copyTotpBtn.addEventListener('click', () => {
  copyToClipboard(codeEl.textContent, copyTotpBtn, 'Copy');
});

resetTotpBtn.addEventListener('click', () => {
  secretEl.value = '';
  updateTotpDisplay();
  secretEl.focus();
});

toggleBtn.addEventListener('click', () => {
  visible = !visible;
  secretEl.type = visible ? 'text' : 'password';
  toggleBtn.textContent = visible ? '🙈' : '👁';
  secretEl.focus();
});

clearBtn.addEventListener('click', () => {
  secretEl.value = '';
  updateTotpDisplay();
  secretEl.focus();
});

secretEl.addEventListener('input', updateTotpDisplay);

// Password event listeners
generatePasswordBtn.addEventListener('click', generateAndDisplayPassword);

copyPasswordBtn.addEventListener('click', () => {
  copyToClipboard(passwordEl.textContent, copyPasswordBtn, 'Copy');
});

// Navigation event listeners
navTotpBtn.addEventListener('click', () => showScreen('totp'));
navPasswordBtn.addEventListener('click', () => showScreen('password'));

// ===== INITIALIZATION =====

window.addEventListener('DOMContentLoaded', () => {
  // Start with TOTP screen
  showScreen('totp');
  
  // Generate initial password
  generateAndDisplayPassword();
});

window.addEventListener('pagehide', () => {
  // Clean up when popup is closed
  stopTotpTimer();
  
  // Best-effort in-memory clear
  secretEl.value = '';
  passwordEl.textContent = '------------';
});
