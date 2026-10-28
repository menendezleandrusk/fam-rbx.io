// ==============================================================================
// FAM MILITARY SYSTEM — CLIENT APPLICATION (GITHUB PAGES STATIC)
// Persistencia LocalStorage, Consulta Criptográfica y OAuth2 Generator
// ==============================================================================

const FAM_ASSETS = {
  emblem: "https://raw.githubusercontent.com/FAM-Roblox/assets/main/fam_emblem.png"
};

// Base de Datos Estática Precargada
const DEFAULT_DIPLOMAS = [
  {
    id: "FAM-CERT-2026-9A81B",
    cadetRoblox: "Roblox_Cadete_Alpha",
    rank: "Subteniente C.P.A.",
    course: "Piloto Aviador de Caza y Combate (F-5E Tiger II)",
    instructorName: "Coronel Rafael G. Ordóñez",
    baseLocation: "Base Aérea Militar No. 1 Santa Lucía",
    issueDate: "2026-10-25",
    notes: "Graduado con Mención Honorífica en tiro de precisión aéreo.",
    status: "VALID"
  },
  {
    id: "FAM-CERT-2026-4C72D",
    cadetRoblox: "Mecánico_Aero_MX",
    rank: "Teniente C.P.A.",
    course: "Especialista en Mantenimiento Aeronáutico de Combate",
    instructorName: "Mayor Javier Ruiz M.",
    baseLocation: "Escuela Militar de Aviación",
    issueDate: "2026-10-20",
    notes: "Certificación en inspección de turbinas a reacción.",
    status: "VALID"
  },
  {
    id: "FAM-CERT-2026-1E50F",
    cadetRoblox: "Aguila_Real_FAM",
    rank: "Capitán Segundo C.P.A.",
    course: "Operaciones Tácticas Aéreas y Reconocimiento Avanzado",
    instructorName: "General de División C.P.A. M. Estrada",
    baseLocation: "Base Aérea Militar No. 5 Zapopan",
    issueDate: "2026-10-27",
    notes: "Acreditación táctica de vuelo nocturno y formación cerrada.",
    status: "VALID"
  }
];

// Gestión de Persistencia en Navegador (LocalStorage)
function getDiplomasDB() {
  try {
    const stored = localStorage.getItem("fam_github_pages_diplomas");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error al leer LocalStorage:", e);
  }
  return DEFAULT_DIPLOMAS;
}

function saveDiplomasDB(list) {
  try {
    localStorage.setItem("fam_github_pages_diplomas", JSON.stringify(list));
  } catch (e) {
    console.error("Error al guardar en LocalStorage:", e);
  }
}

// INICIALIZACIÓN AL CARGAR LA PÁGINA
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupSearch();
  setupExpediteForm();
  setupOAuthCalculator();
  renderRecentDiplomas();

  // Comprobar si hay un folio en la URL (?folio=FAM-CERT-...)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedFolio = urlParams.get("folio") || urlParams.get("code");
  if (requestedFolio) {
    document.getElementById("cert-search-input").value = requestedFolio;
    verifyDiploma(requestedFolio);
  }
});

// NAVEGACIÓN POR PESTAÑAS
function setupTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");
    });
  });
}

// BÚSQUEDA Y VERIFICACIÓN
function setupSearch() {
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("cert-search-input");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      verifyDiploma(searchInput.value.trim());
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        verifyDiploma(searchInput.value.trim());
      }
    });
  }
}

function verifyDiploma(query) {
  const resultContainer = document.getElementById("search-result-container");
  if (!resultContainer) return;

  if (!query) {
    resultContainer.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 14px; text-align: center; color: #fca5a5; font-size: 0.9rem;">
        ⚠️ Por favor introduce un folio militar (ej. <code>FAM-CERT-2026-9A81B</code>) o el nombre de un cadete.
      </div>
    `;
    return;
  }

  const cleanQuery = query.toUpperCase();
  const db = getDiplomasDB();
  const match = db.find(d => 
    d.id.toUpperCase() === cleanQuery || 
    d.cadetRoblox.toUpperCase().includes(cleanQuery)
  );

  if (match) {
    resultContainer.innerHTML = renderDiplomaHtml(match);
  } else {
    resultContainer.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 20px; text-align: center; color: #fca5a5;">
        <h4 style="margin-bottom: 6px; font-weight: 800;">❌ Folio Militar No Encontrado</h4>
        <p style="font-size: 0.85rem; color: #cbd5e1;">El identificador "<strong>${query}</strong>" no consta en el registro criptográfico militar de la FAM.</p>
      </div>
    `;
  }
}

// RENDERIZADO VISUAL DEL DIPLOMA
function renderDiplomaHtml(diploma) {
  const isValid = diploma.status === "VALID";
  const shareUrl = `${window.location.origin}${window.location.pathname}?folio=${encodeURIComponent(diploma.id)}`;

  return `
    <div class="diploma-certificate">
      <div class="cert-header">
        <div class="cert-emblem">
          <img src="${FAM_ASSETS.emblem}" alt="Escudo FAM">
        </div>
        <h3>FUERZA AÉREA MEXICANA</h3>
        <span>COMANDANCIA DE EDUCACIÓN MILITAR • ROBLOX RO-ARMY</span>
      </div>

      <div class="cert-body">
        <p class="cert-grant">CERTIFICADO Y ACREDITACIÓN OFICIAL OTORGADA A:</p>
        <h2 class="cert-cadet">${escapeHtml(diploma.cadetRoblox)}</h2>
        <div class="cert-rank">RANGO: ${escapeHtml(diploma.rank)}</div>

        <div>
          <span class="cert-course-badge">🎖️ ${escapeHtml(diploma.course)}</span>
        </div>

        <p style="font-size: 0.88rem; color: #94a3b8; max-width: 550px; margin: 0 auto 20px; font-style: italic;">
          "${escapeHtml(diploma.notes || 'Acreditación militar satisfactoria.')}"
        </p>

        <div class="cert-grid">
          <div class="cert-meta-item">
            <small>Folio Oficial</small>
            <span><code>${escapeHtml(diploma.id)}</code></span>
          </div>
          <div class="cert-meta-item">
            <small>Fecha de Emisión</small>
            <span>${escapeHtml(diploma.issueDate)}</span>
          </div>
          <div class="cert-meta-item">
            <small>Oficial Expedidor</small>
            <span>${escapeHtml(diploma.instructorName)}</span>
          </div>
          <div class="cert-meta-item">
            <small>Base de Adscripción</small>
            <span>${escapeHtml(diploma.baseLocation || 'B.A.M. No. 1 Santa Lucía')}</span>
          </div>
        </div>
      </div>

      <div class="cert-footer">
        <div>
          <span>Estado: </span>
          <span style="color: ${isValid ? '#10b981' : '#ef4444'}; font-weight: bold;">
            ${isValid ? '● VIGENTE Y REGISTRADO' : '● ANULADO'}
          </span>
        </div>
        <div class="cert-stamp">FIRMA DIGITAL OAUTH2</div>
        <div>
          <button onclick="navigator.clipboard.writeText('${shareUrl}'); alert('Enlace directo copiado al portapapeles.');" 
                  class="btn btn-outline" style="padding: 4px 10px; font-size: 0.75rem;">
            📋 Copiar Enlace
          </button>
        </div>
      </div>
    </div>
  `;
}

// FORMULARIO DE EXPEDICIÓN DE DIPLOMAS (SIMULADOR DE INSTRUCTOR)
function setupExpediteForm() {
  const form = document.getElementById("expedite-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const cadetName = document.getElementById("form-cadet").value.trim();
    const courseName = document.getElementById("form-course").value.trim();
    const rankName = document.getElementById("form-rank").value.trim();
    const instructorName = document.getElementById("form-instructor").value.trim();
    const notes = document.getElementById("form-notes").value.trim();

    if (!cadetName || !courseName) {
      alert("Por favor completa al menos el nombre del cadete y el curso.");
      return;
    }

    // Generar Folio Criptográfico corto único
    const randomHex = Math.random().toString(16).substring(2, 7).toUpperCase();
    const newId = `FAM-CERT-2026-${randomHex}`;

    const newDiploma = {
      id: newId,
      cadetRoblox: cadetName,
      course: courseName,
      rank: rankName || "Subteniente C.P.A.",
      instructorName: instructorName || "Oficial Instructor FAM",
      baseLocation: "Base Aérea Militar No. 1 Santa Lucía",
      issueDate: new Date().toISOString().split("T")[0],
      notes: notes || "Acreditación militar satisfactoria.",
      status: "VALID"
    };

    const currentDb = getDiplomasDB();
    currentDb.unshift(newDiploma);
    saveDiplomasDB(currentDb);

    alert(`¡Diploma expedido con éxito!\nFolio Criptográfico: ${newId}`);
    form.reset();

    // Actualizar vista reciente y cambiar a la pestaña de consulta
    renderRecentDiplomas();
    document.querySelector('.tab-btn[data-tab="tab-search"]').click();
    document.getElementById("cert-search-input").value = newId;
    verifyDiploma(newId);
  });
}

// LISTA DE DIPLOMAS RECIENTES
function renderRecentDiplomas() {
  const container = document.getElementById("recent-diplomas-list");
  if (!container) return;

  const db = getDiplomasDB();
  container.innerHTML = db.slice(0, 5).map(d => `
    <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #1e293b; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <div>
        <strong style="color: #34d399; font-size: 0.95rem;">${escapeHtml(d.cadetRoblox)}</strong>
        <div style="font-size: 0.78rem; color: #94a3b8;">${escapeHtml(d.course)} • ${escapeHtml(d.rank)}</div>
      </div>
      <div style="text-align: right;">
        <span style="font-family: monospace; font-size: 0.8rem; background: #022c22; color: #10b981; padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.3);">
          ${escapeHtml(d.id)}
        </span>
        <button onclick="document.getElementById('cert-search-input').value='${d.id}'; verifyDiploma('${d.id}'); window.scrollTo({top: 250, behavior: 'smooth'});"
                class="btn btn-outline" style="padding: 3px 8px; font-size: 0.72rem; margin-left: 6px;">
          Ver
        </button>
      </div>
    </div>
  `).join("");
}

// CONFIGURADOR DINÁMICO DE ENLACE DISCORD OAUTH2
function setupOAuthCalculator() {
  const clientIdInput = document.getElementById("oauth-client-id");
  const redirectInput = document.getElementById("oauth-redirect-uri");
  const outputLink = document.getElementById("oauth-generated-link");

  if (!clientIdInput || !redirectInput || !outputLink) return;

  // Autocompletar con la URL actual de GitHub Pages
  if (!redirectInput.value) {
    redirectInput.value = `${window.location.origin}${window.location.pathname}`;
  }

  function updateLink() {
    const cid = clientIdInput.value.trim() || "1539391208411889676";
    const ruri = encodeURIComponent(redirectInput.value.trim());
    const fullAuth = `https://discord.com/oauth2/authorize?client_id=${cid}&response_type=code&redirect_uri=${ruri}&scope=identify+guilds.members.read`;
    
    outputLink.href = fullAuth;
    outputLink.innerText = fullAuth;
  }

  clientIdInput.addEventListener("input", updateLink);
  redirectInput.addEventListener("input", updateLink);
  updateLink();
}

// UTILIDADES
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
