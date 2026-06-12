const _ = browser.i18n.getMessage;

const STATUS_CONFIG = {
  pq: { icon: "\u{1f6e1}️", labelKey: "statusPqLabel", subKey: "statusPqSub", class: "status-pq" },
  classical: { icon: "⚠️", labelKey: "statusClassicalLabel", subKey: "statusClassicalSub", class: "status-classical" },
  insecure: { icon: "\u{1f6a8}", labelKey: "statusInsecureLabel", subKey: "statusInsecureSub", class: "status-insecure" },
  unknown: { icon: "❓", labelKey: "statusUnknownLabel", subKey: "statusUnknownSub", class: "status-unknown" },
};

function extractCN(dn) {
  if (!dn) return "?";
  const match = dn.match(/CN=([^,]+)/i);
  return match ? match[1] : dn.substring(0, 60);
}

function renderDetails(info) {
  let html = '<div class="details">';

  if (info.error) {
    html += `<div class="detail-section"><h2>${_("sectionError")}</h2>
      <p style="color:#f87171;font-size:12px">${escapeHtml(info.error)}</p></div>`;
  }

  if (info.host) {
    html += `<div class="detail-section"><h2>${_("sectionConnection")}</h2>`;
    html += detailRow(_("labelHost"), info.host);
    if (info.protocolVersion) html += detailRow(_("labelProtocol"), info.protocolVersion);
    if (info.cipherSuite) html += detailRow(_("labelCipherSuite"), info.cipherSuite);
    if (info.keaGroupName) {
      html += detailRow(_("labelKeyExchange"),
        `${info.keaGroupName} ${info.pqKeyExchange
          ? `<span class="tag tag-pq">${_("tagPq")}</span>`
          : `<span class="tag tag-classical">${_("tagClassical")}</span>`}`
      );
    }
    if (info.signatureScheme) {
      html += detailRow(_("labelSignature"),
        `${info.signatureScheme} ${info.pqSignature
          ? `<span class="tag tag-pq">${_("tagPq")}</span>`
          : `<span class="tag tag-classical">${_("tagClassical")}</span>`}`
      );
    }
    html += "</div>";
  }

  if (info.certificates && info.certificates.length > 0) {
    html += `<div class="detail-section"><h2>${_("sectionCertChain")}</h2>`;
    for (const cert of info.certificates) {
      html += `<div class="cert-card">
        <div class="cert-subject">${escapeHtml(extractCN(cert.subject))}</div>
        <div class="cert-issuer">${_("labelIssuer")}: ${escapeHtml(extractCN(cert.issuer))}</div>
      </div>`;
    }
    html += "</div>";
  }

  if (!info.host && !info.error) {
    html += `<div class="detail-section">
      <p style="color:#94a3b8;font-size:12px;text-align:center;padding:8px">
        ${_("reloadHint")}
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
  document.getElementById("headerTitle").textContent = _("headerTitle");
  document.getElementById("footer").textContent = _("footer");

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tabs || tabs.length === 0) return;

  const tabId = tabs[0].id;
  const info = await browser.runtime.sendMessage({ type: "getState", tabId });
  const cfg = STATUS_CONFIG[info.state] || STATUS_CONFIG.unknown;

  document.getElementById("content").innerHTML = `
    <div class="status-banner ${cfg.class}">
      <div class="status-icon">${cfg.icon}</div>
      <div class="status-label">${_(cfg.labelKey)}</div>
      <div class="status-sub">${_(cfg.subKey)}</div>
    </div>
    ${renderDetails(info)}
  `;
}

init();
