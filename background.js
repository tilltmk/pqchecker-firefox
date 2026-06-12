const PQ_KEX_PATTERNS = [
  "mlkem", "ml-kem", "kyber",
  "x25519mlkem", "x25519kyber",
  "secp256r1mlkem",
  "bike", "hqc", "frodokem",
  "ntru", "saber", "crystals",
];

const PQ_SIG_PATTERNS = [
  "ml-dsa", "mldsa", "dilithium",
  "falcon", "sphincs", "slh-dsa", "slhdsa",
];

const tabStates = new Map();

function matchesPq(value, patterns) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

function applyIcon(tabId) {
  const info = tabStates.get(tabId);
  const state = info ? info.state : "unknown";

  const config = {
    pq: { icon: "pq", badge: "PQ", color: "#16a34a", title: "Post-Quantum gesichert" },
    classical: { icon: "classical", badge: "!", color: "#d97706", title: "Klassisch (kein PQ)" },
    insecure: { icon: "insecure", badge: "X", color: "#dc2626", title: "Kein HTTPS" },
    unknown: { icon: "unknown", badge: "?", color: "#6b7280", title: "Unbekannt" },
  };
  const c = config[state] || config.unknown;

  browser.browserAction.setIcon({ tabId, path: `icons/${c.icon}-48.png` }).catch(() => {});
  browser.browserAction.setBadgeText({ tabId, text: c.badge }).catch(() => {});
  browser.browserAction.setBadgeBackgroundColor({ tabId, color: c.color }).catch(() => {});
  browser.browserAction.setTitle({ tabId, title: c.title }).catch(() => {});
}

browser.webRequest.onHeadersReceived.addListener(
  async (details) => {
    if (details.tabId < 0 || details.type !== "main_frame") return;

    const url = new URL(details.url);

    if (url.protocol !== "https:") {
      tabStates.set(details.tabId, { state: "insecure", host: url.hostname });
      return;
    }

    try {
      const secInfo = await browser.webRequest.getSecurityInfo(
        details.requestId, { certificateChain: true }
      );

      const keaGroup = secInfo.keaGroupName || "";
      const pqKex = matchesPq(keaGroup, PQ_KEX_PATTERNS);
      const sigScheme = secInfo.signatureSchemeName || "";
      const pqSig = matchesPq(sigScheme, PQ_SIG_PATTERNS);
      const state = pqKex ? "pq" : "classical";

      tabStates.set(details.tabId, {
        state, host: url.hostname,
        keaGroupName: keaGroup,
        cipherSuite: secInfo.cipherSuite || "",
        protocolVersion: secInfo.protocolVersion || "",
        pqKeyExchange: pqKex, pqSignature: pqSig,
        signatureScheme: sigScheme,
        certificates: (secInfo.certificates || []).map(cert => ({
          subject: cert.subject, issuer: cert.issuer,
          serialNumber: cert.serialNumber || "",
          validity: cert.validity || {},
        })),
      });
    } catch (e) {
      tabStates.set(details.tabId, {
        state: "unknown", host: url.hostname,
        error: `${e.name}: ${e.message}`,
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    setTimeout(() => applyIcon(tabId), 300);
    setTimeout(() => applyIcon(tabId), 1000);
  }
});

browser.tabs.onActivated.addListener((activeInfo) => {
  setTimeout(() => applyIcon(activeInfo.tabId), 100);
});

browser.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getState") {
    sendResponse(tabStates.get(message.tabId) || { state: "unknown" });
  }
});
