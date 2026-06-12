const STATUS_CONFIG = {
  pq: {
    icon: "\u{1f6e1}️",
    label: "Post-Quantum gesichert",
    sub: "Diese Verbindung nutzt Post-Quantum-Kryptografie",
    class: "status-pq",
  },
  classical: {
    icon: "⚠️",
    label: "Klassische Kryptografie",
    sub: "Kein Post-Quantum-Schutz aktiv",
    class: "status-classical",
  },
  insecure: {
    icon: "\u{1f6a8}",
    label: "Nicht verschlüsselt",
    sub: "Keine TLS/HTTPS-Verbindung",
    class: "status-insecure",
  },
  unknown: {
    icon: "❓",
    label: "Unbekannt",
    sub: "Seite neu laden, um den Status zu ermitteln",
    class: "status-unknown",
  },
};

function extractCN(dn) {
  if (!dn) return "(unbekannt)";
  const match = dn.match(/CN=([^,]+)/i);
  return match ? match[1] : dn.substring(0, 60);
}

function renderDetails(info) {
  let html = '<div class="details">';

  if (info.error) {
    html += `<div class="detail-section"><h2>Fehler</h2>
      <p style="color:#f87171;font-size:12px">${escapeHtml(info.error)}</p></div>`;
  }

  if (info.host) {
    html += '<div class="detail-section"><h2>Verbindung</h2>';
    html += detailRow("Host", info.host);
    if (info.protocolVersion) html += detailRow("Protokoll", info.protocolVersion);
    if (info.cipherSuite) html += detailRow("Cipher Suite", info.cipherSuite);
    if (info.keaGroupName) {
      html += detailRow(
        "Key Exchange",
        `${info.keaGroupName} ${info.pqKeyExchange ? '<span class="tag tag-pq">PQ</span>' : '<span class="tag tag-classical">Klassisch</span>'}`
      );
    }
    if (info.signatureScheme) {
      html += detailRow(
        "Signatur",
        `${info.signatureScheme} ${info.pqSignature ? '<span class="tag tag-pq">PQ</span>' : '<span class="tag tag-classical">Klassisch</span>'}`
      );
    }
    html += "</div>";
  }

  if (info.certificates && info.certificates.length > 0) {
    html += '<div class="detail-section"><h2>Zertifikatskette</h2>';
    for (const cert of info.certificates) {
      html += `<div class="cert-card">
        <div class="cert-subject">${escapeHtml(extractCN(cert.subject))}</div>
        <div class="cert-issuer">Issuer: ${escapeHtml(extractCN(cert.issuer))}</div>
      </div>`;
    }
    html += "</div>";
  }

  if (!info.host && !info.error) {
    html += `<div class="detail-section">
      <p style="color:#94a3b8;font-size:12px;text-align:center;padding:8px">
        Lade die Seite neu (F5), damit die TLS-Verbindung analysiert werden kann.
      </p></div>`;
  }

  html += "</div>";
  return html;
}

function detailRow(key, value) {
  return `<div class="detail-row"><span class="detail-key">${escapeHtml(key)}</span><span class="detail-value">${value}</span></div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function init() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tabs || tabs.length === 0) return;

  const tabId = tabs[0].id;
  const tabUrl = tabs[0].url || "";
  const info = await browser.runtime.sendMessage({ type: "getState", tabId });
  const status = STATUS_CONFIG[info.state] || STATUS_CONFIG.unknown;

  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="status-banner ${status.class}">
      <div class="status-icon">${status.icon}</div>
      <div class="status-label">${status.label}</div>
      <div class="status-sub">${status.sub}</div>
    </div>
    ${renderDetails(info)}
    <div class="details" style="padding-top:0">
      <div class="detail-row" style="opacity:0.4">
        <span class="detail-key">Tab ID</span>
        <span class="detail-value">${tabId}</span>
      </div>
      <div class="detail-row" style="opacity:0.4">
        <span class="detail-key">Tab URL</span>
        <span class="detail-value" style="max-width:260px;overflow:hidden;text-overflow:ellipsis">${escapeHtml(tabUrl)}</span>
      </div>
    </div>
  `;
}

init();
