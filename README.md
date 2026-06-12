# Post-Quantum Certificate Checker

A Firefox/Zen Browser extension that shows whether a website uses post-quantum secure cryptography for its TLS connection.

## Features

- Detects **post-quantum key exchange** algorithms (ML-KEM, Kyber, X25519MLKEM768, etc.)
- Detects **post-quantum signature** algorithms (ML-DSA, Dilithium, FALCON, SPHINCS+, etc.)
- Displays connection details: cipher suite, key exchange, signature scheme
- Shows the full **certificate chain**
- Color-coded toolbar icon:
  - 🟢 **PQ** — Post-quantum key exchange active
  - 🟡 **!** — Classical cryptography only
  - 🔴 **X** — No HTTPS
  - ⚪ **?** — Unknown (reload page)
- Supports **English** and **German**

## Screenshot

![Post-Quantum Checker Popup](https://raw.githubusercontent.com/tilltmk/pqchecker-firefox/main/icons/pq-96.png)
<img width="366" height="636" alt="grafik" src="https://github.com/user-attachments/assets/ba7f530a-e607-4554-9aa7-0ac2c1199c78" />


## Installation

### From XPI file
1. Download the latest `.xpi` from [Releases](https://github.com/tilltmk/pqchecker-firefox/releases)
2. In Firefox/Zen Browser, go to `about:config` and set `xpinstall.signatures.required` to `false`
3. Go to `about:addons` → gear icon → "Install Add-on From File..."
4. Select the `.xpi` file

### From source (temporary)
1. Clone this repo
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select `manifest.json`

## How it works

The extension uses Firefox's [`webRequest.getSecurityInfo()`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/getSecurityInfo) API to inspect the TLS connection of each page load. It checks the `keaGroupName` property for post-quantum key exchange algorithms like `X25519MLKEM768` (a hybrid combining X25519 with ML-KEM-768).

As of 2025, Firefox and Chrome both default to X25519MLKEM768 for HTTPS connections, meaning most websites already use hybrid post-quantum key exchange.

## Permissions

- `webRequest` / `webRequestBlocking` — Required to call `getSecurityInfo()`
- `tabs` — Required to track active tabs and update the icon
- `<all_urls>` — Required to inspect TLS on all websites

## License

MIT
