/* ===========================================================
   Le Paradisier Manager — Application logic (script.js)
   - Router (hash-based)
   - SVG icon registry
   - Premium views: Dashboard, Expenses, Entries, Invoices, etc.
   - CRUD modules with filters
   - Backup / restore / reset
   =========================================================== */

// ---- DOM helpers ----
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const fmt = {
  money(n) {
    const v = Math.round(Number(n) || 0);
    return v.toLocaleString("fr-FR").replaceAll(",", " ") + " Ar";
  },
  moneyShort(n) {
    const v = Math.round(Number(n) || 0);
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1).replace(".", ",") + " M Ar";
    if (v >= 1_000) return (v / 1_000).toFixed(0) + " k Ar";
    return v + " Ar";
  },
  date(s) {
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  },
  dateShort(s) {
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  },
  dateInput(s) {
    if (!s) return "";
    return String(s).slice(0, 10);
  },
};

/* =====================================================
   ICON REGISTRY (Lucide-style inline SVG, MIT)
   ===================================================== */
const ICONS = {
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  trendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  trendingDown: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  fileText: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
  shoppingBag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  truck: '<path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><path d="M15 18H9"/><circle cx="17" cy="18" r="2"/>',
  bed: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  close: '<line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>',
  plus: '<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  creditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  banknote: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  chevron: '<polyline points="6 9 12 15 18 9"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  tag: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  arrowDownCircle: '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" x2="12" y1="8" y2="16"/>',
  arrowUpCircle: '<circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" x2="12" y1="16" y2="8"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
};

function svg(name) {
  const path = ICONS[name];
  if (!path) return "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
function icon(name, extraClass = "") {
  return `<span class="icon${extraClass ? " " + extraClass : ""}">${svg(name)}</span>`;
}

function bindIcons(root = document) {
  $$("[data-icon]", root).forEach(el => {
    if (el.dataset.iconRendered) return;
    const name = el.dataset.icon;
    el.innerHTML = svg(name);
    el.dataset.iconRendered = "1";
  });
}

/* =====================================================
   App state
   ===================================================== */
let state = null;
let currentRoute = "dashboard";
let currentPeriod = "month";

document.addEventListener("DOMContentLoaded", () => {
  state = DB.load();
  bindShell();
  bindIcons();
  navigate(getRouteFromHash() || "dashboard");
});

function bindShell() {
  $$(".nav-item").forEach(el => {
    el.addEventListener("click", () => {
      const route = el.dataset.route;
      location.hash = "#/" + route;
    });
  });
  window.addEventListener("hashchange", () => navigate(getRouteFromHash()));

  // Mobile menu
  const sb = $("#sidebar");
  const bd = $("#sidebarBackdrop");
  $("#menuToggle").addEventListener("click", () => {
    sb.classList.toggle("open");
    bd.classList.toggle("open");
  });
  bd.addEventListener("click", () => { sb.classList.remove("open"); bd.classList.remove("open"); });
  sb.addEventListener("click", e => {
    if (e.target.closest(".nav-item")) {
      sb.classList.remove("open"); bd.classList.remove("open");
    }
  });

  // Period filter
  $("#periodFilter").addEventListener("change", e => {
    currentPeriod = e.target.value;
    if (["dashboard", "reports", "expenses", "entries"].includes(currentRoute)) navigate(currentRoute);
  });

  // Export rapport
  $("#exportReport").addEventListener("click", exportReport);

  // Modal close
  $("#modalClose").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", e => {
    if (e.target.id === "modal") closeModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !$("#modal").hidden) closeModal();
  });
}

function getRouteFromHash() {
  const m = location.hash.match(/^#\/(\w+)/);
  return m ? m[1] : "dashboard";
}

function navigate(route) {
  const allowed = ["dashboard", "entries", "expenses", "orders", "deliveries", "apartments", "invoices", "reports", "settings", "backup"];
  if (!allowed.includes(route)) route = "dashboard";
  currentRoute = route;
  $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.route === route));

  const titles = {
    dashboard: ["Bonjour, " + (state.settings.manager || "Gérant"), "Aperçu de l’activité de l’établissement."],
    entries: ["Entrées d’argent", "Suivi des recettes du restaurant et des résidences."],
    expenses: ["Sorties / Dépenses", "Suivi des charges, achats, salaires et dépenses."],
    orders: ["Commandes", "Suivi du restaurant et des commandes en cours."],
    deliveries: ["Livraisons", "Suivi des livraisons et de leur statut."],
    apartments: ["Appartements", "Disponibilité et état des résidences."],
    invoices: ["Factures", "Émission et suivi des règlements."],
    reports: ["Rapports", "Synthèse de l’activité par période."],
    settings: ["Paramètres", "Configuration de l’établissement."],
    backup: ["Sauvegarde", "Export, import et réinitialisation des données."],
  };
  const [t, s] = titles[route];
  $("#helloTitle").textContent = t;
  $("#helloSubtitle").textContent = s;

  switch (route) {
    case "dashboard": renderDashboard(); break;
    case "entries": renderEntries(); break;
    case "expenses": renderExpenses(); break;
    case "orders": renderOrders(); break;
    case "deliveries": renderDeliveries(); break;
    case "apartments": renderApartments(); break;
    case "invoices": renderInvoices(); break;
    case "reports": renderReports(); break;
    case "settings": renderSettings(); break;
    case "backup": renderBackup(); break;
  }
  bindIcons();
  $("#view").scrollTo?.({ top: 0 });
  window.scrollTo?.(0, 0);
}

/* =====================================================
   Period filtering
   ===================================================== */
function withinPeriod(dateStr, period = currentPeriod) {
  const d = new Date(dateStr);
  if (isNaN(d)) return false;
  const now = new Date();
  switch (period) {
    case "today": return d.toDateString() === now.toDateString();
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return d >= start && d <= now;
    }
    case "month":
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    case "year":
      return d.getFullYear() === now.getFullYear();
    default: return true;
  }
}

/* =====================================================
   Reusable components
   ===================================================== */
function pageHead({ title, subtitle, actions = "" }) {
  return `
    <div class="page-head">
      <div class="titles">
        <h2>${escapeHtml(title)}</h2>
        ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
      </div>
      ${actions ? `<div class="actions">${actions}</div>` : ""}
    </div>
  `;
}

function kpiCard({ label, value, meta, iconName, accent }) {
  const accentCls = accent === "paradis" ? "paradis" : accent === "cream" ? "cream alt-icon" : accent === "alt" ? "alt-icon" : "";
  return `
    <div class="kpi ${accentCls}">
      <div class="kpi-icon">${svg(iconName)}</div>
      <div class="kpi-body">
        <p class="kpi-label">${escapeHtml(label)}</p>
        <h3 class="kpi-value">${value}</h3>
        ${meta ? `<p class="kpi-meta">${meta}</p>` : ""}
      </div>
    </div>
  `;
}

function sectionHead({ title, meta = "", actions = "" }) {
  return `
    <div class="section-head">
      <span class="gold-bar"></span>
      <h3>${escapeHtml(title)}</h3>
      ${meta ? `<span class="meta">${meta}</span>` : ""}
      ${actions ? `<div class="actions">${actions}</div>` : ""}
    </div>
  `;
}

function emptyState({ iconName = "inbox", message = "Aucun élément à afficher.", hint = "" } = {}) {
  return `
    <div class="empty">
      ${icon(iconName)}
      <div>${escapeHtml(message)}</div>
      ${hint ? `<div style="margin-top:6px; font-size:12px;">${escapeHtml(hint)}</div>` : ""}
    </div>
  `;
}

function filterBar(scope, chips, searchPlaceholder = "Rechercher…") {
  return `
    <div class="filter-bar">
      <div class="search-bar">
        ${icon("search")}
        <input data-search="${scope}" placeholder="${escapeAttr(searchPlaceholder)}" />
      </div>
      ${chips.map(c => `
        <label class="filter-chip">
          ${icon(c.iconName || "filter")}
          <select data-filter="${scope}" data-key="${c.key}">
            ${c.options.map(o => `<option value="${escapeAttr(o)}">${escapeHtml(o)}</option>`).join("")}
          </select>
          ${icon("chevron", "chev")}
        </label>
      `).join("")}
    </div>
  `;
}

function readFilters(scope) {
  const q = ($(`[data-search="${scope}"]`)?.value || "").trim().toLowerCase();
  const filters = {};
  $$(`[data-filter="${scope}"]`).forEach(el => {
    filters[el.dataset.key] = el.value;
  });
  return { q, filters };
}

function bindFilter(scope, cb) {
  $(`[data-search="${scope}"]`)?.addEventListener("input", cb);
  $$(`[data-filter="${scope}"]`).forEach(el => el.addEventListener("change", cb));
}

function bindAdd(id, cb) {
  const b = document.getElementById(id);
  if (b) b.addEventListener("click", cb);
}

/* =====================================================
   DASHBOARD
   ===================================================== */
function renderDashboard() {
  const periodEntries = state.entries.filter(e => withinPeriod(e.date) && e.paid);
  const periodExpenses = state.expenses.filter(e => withinPeriod(e.date));

  const todaysEntries = state.entries.filter(e => withinPeriod(e.date, "today") && e.paid);
  const caJour = sum(todaysEntries, "amount");
  const entreesMois = sum(periodEntries, "amount");
  const sortiesMois = sum(periodExpenses, "amount");
  const benefice = entreesMois - sortiesMois;

  const cmdJour = state.orders.filter(o => withinPeriod(o.date, "today")).length;
  const livEnCours = state.deliveries.filter(d => d.status === "En cours").length;
  const aptDispo = state.apartments.filter(a => a.status === "Disponible").length;
  const aptOccup = state.apartments.filter(a => a.status === "Occupé").length;
  const totalApts = state.apartments.length;
  const facImpayees = state.invoices.filter(f => f.status !== "Payée").length;
  const facPayees = state.invoices.filter(f => f.status === "Payée").length;

  // Bar chart 7 derniers jours
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const inSum = sum(state.entries.filter(e => e.date === key && e.paid), "amount");
    const outSum = sum(state.expenses.filter(e => e.date === key), "amount");
    days.push({
      label: d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3),
      in: inSum,
      out: outSum,
    });
  }
  const max = Math.max(1, ...days.flatMap(d => [d.in, d.out]));

  // CA par activité
  const caByCat = {};
  for (const e of periodEntries) caByCat[e.category] = (caByCat[e.category] || 0) + e.amount;
  const totalCA = Object.values(caByCat).reduce((a, b) => a + b, 0) || 1;
  const catRows = Object.entries(caByCat).sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({ cat, val, pct: Math.round((val / totalCA) * 100) }));

  const lastOrders = state.orders.slice(0, 5);
  const lastEntries = state.entries.slice(0, 5);
  const lastExpenses = state.expenses.slice(0, 5);
  const lastInvoices = state.invoices.slice(0, 5);

  $("#view").innerHTML = `
    ${pageHead({
      title: "Tableau de bord",
      subtitle: "Vue d’ensemble de votre établissement — recettes, charges et activité.",
      actions: `<button class="btn btn-ghost" data-jump="reports">${icon("chart")} Rapports</button>
                <button class="btn btn-gold" id="exportFromDash">${icon("download")} Exporter</button>`,
    })}

    <div class="kpi-grid cols-5">
      ${kpiCard({ label: "CA du jour", value: fmt.money(caJour), meta: `${todaysEntries.length} encaissements`, iconName: "coins", accent: "" })}
      ${kpiCard({ label: "Entrées · " + periodLabel(currentPeriod), value: fmt.money(entreesMois), meta: `${periodEntries.length} mouvements`, iconName: "trendingUp", accent: "alt" })}
      ${kpiCard({ label: "Sorties · " + periodLabel(currentPeriod), value: fmt.money(sortiesMois), meta: `${periodExpenses.length} dépenses`, iconName: "trendingDown", accent: "" })}
      ${kpiCard({ label: "Bénéfice estimé", value: fmt.money(benefice), meta: benefice >= 0 ? `<span class="up">▲ Marge positive</span>` : `<span class="down">▼ Marge négative</span>`, iconName: "sparkles", accent: "paradis" })}
      ${kpiCard({ label: "Factures impayées", value: facImpayees + " / " + (facPayees + facImpayees), meta: "À encaisser", iconName: "fileText", accent: "alt" })}
    </div>

    <div class="kpi-grid">
      ${kpiCard({ label: "Commandes aujourd’hui", value: cmdJour, iconName: "shoppingBag", accent: "" })}
      ${kpiCard({ label: "Livraisons en cours", value: livEnCours, iconName: "truck", accent: "alt" })}
      ${kpiCard({ label: "Appart. disponibles", value: `${aptDispo} / ${totalApts}`, iconName: "bed", accent: "" })}
      ${kpiCard({ label: "Appart. occupés", value: `${aptOccup} / ${totalApts}`, meta: `${Math.round((aptOccup / totalApts) * 100)}% d’occupation`, iconName: "home", accent: "alt" })}
    </div>

    <div class="charts-grid">
      <div class="section">
        ${sectionHead({ title: "Entrées vs Sorties — 7 derniers jours" })}
        <div class="chart-bars">
          ${days.map(d => `
            <div class="bar-group">
              <div class="bar-stack" title="Entrées ${fmt.money(d.in)} · Sorties ${fmt.money(d.out)}">
                <div class="bar in" style="height:${(d.in / max) * 100}%"></div>
                <div class="bar out" style="height:${(d.out / max) * 100}%"></div>
              </div>
              <div class="bar-label">${d.label}</div>
            </div>
          `).join("")}
        </div>
        <div class="legend">
          <span><span class="dot in"></span>Entrées</span>
          <span><span class="dot out"></span>Sorties</span>
        </div>
      </div>

      <div class="section">
        ${sectionHead({ title: "CA par activité" })}
        <div class="donut-list">
          ${catRows.length ? catRows.map(r => `
            <div class="donut-row">
              <div class="top"><span>${escapeHtml(r.cat)}</span><span>${fmt.money(r.val)} · ${r.pct}%</span></div>
              <div class="donut-track"><div class="donut-fill" style="width:${r.pct}%"></div></div>
            </div>
          `).join("") : emptyState({ iconName: "inbox", message: "Aucune entrée pour la période." })}
        </div>
      </div>
    </div>

    <div class="section">
      ${sectionHead({
        title: "État des appartements",
        meta: `<strong>${aptDispo}</strong> disponibles · <strong>${aptOccup}</strong> occupés`,
        actions: `<a class="btn btn-ghost btn-sm" href="#/apartments">Voir tout</a>`,
      })}
      <div class="apt-grid">
        ${state.apartments.slice(0, 9).map(apartmentTile).join("")}
      </div>
    </div>

    <div class="cols-3">
      ${recentTable({
        title: "Dernières commandes",
        href: "#/orders",
        head: `<tr><th>N°</th><th>Statut</th><th class="num">Montant</th></tr>`,
        body: lastOrders.map(o => `
          <tr>
            <td>
              <div class="cell-icon">
                <span class="cell-avatar"><span class="icon">${svg("shoppingBag")}</span></span>
                <div class="cell-content">
                  <strong>${o.id}</strong>
                  <span>${fmt.dateShort(o.date)} · ${escapeHtml(o.client || "")}</span>
                </div>
              </div>
            </td>
            <td>${orderStatusPill(o.status)}</td>
            <td class="num">${fmt.money(o.amount)}</td>
          </tr>
        `).join(""),
      })}

      ${recentTable({
        title: "Dernières entrées",
        href: "#/entries",
        head: `<tr><th>Libellé</th><th class="num">Montant</th></tr>`,
        body: lastEntries.map(e => `
          <tr>
            <td>
              <div class="cell-icon">
                <span class="cell-avatar green"><span class="icon">${svg("arrowDownCircle")}</span></span>
                <div class="cell-content">
                  <strong>${escapeHtml(e.label)}</strong>
                  <span>${escapeHtml(e.category)} · ${fmt.dateShort(e.date)}</span>
                </div>
              </div>
            </td>
            <td class="num income">${fmt.money(e.amount)}</td>
          </tr>
        `).join(""),
      })}

      ${recentTable({
        title: "Dernières sorties",
        href: "#/expenses",
        head: `<tr><th>Libellé</th><th class="num">Montant</th></tr>`,
        body: lastExpenses.map(e => `
          <tr>
            <td>
              <div class="cell-icon">
                <span class="cell-avatar red"><span class="icon">${svg("arrowUpCircle")}</span></span>
                <div class="cell-content">
                  <strong>${escapeHtml(e.label)}</strong>
                  <span>${escapeHtml(e.category)} · ${fmt.dateShort(e.date)}</span>
                </div>
              </div>
            </td>
            <td class="num expense">${fmt.money(e.amount)}</td>
          </tr>
        `).join(""),
      })}
    </div>

    <div class="section">
      ${sectionHead({
        title: "Dernières factures",
        actions: `<a class="btn btn-ghost btn-sm" href="#/invoices">Voir tout</a>`,
      })}
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>N°</th><th>Date</th><th>Client</th><th class="num">Montant</th><th>Statut</th></tr></thead>
          <tbody>
            ${lastInvoices.map(f => `
              <tr>
                <td><span class="ref">${f.id}</span></td>
                <td>${fmt.date(f.date)}</td>
                <td>${escapeHtml(f.client || "—")}</td>
                <td class="num">${fmt.money(f.amount)}</td>
                <td>${invoiceStatusPill(f.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  $("#exportFromDash")?.addEventListener("click", exportReport);
  $$("[data-jump]").forEach(b => b.addEventListener("click", () => location.hash = "#/" + b.dataset.jump));
}

function recentTable({ title, href, head, body }) {
  return `
    <div class="section">
      ${sectionHead({
        title,
        actions: `<a class="btn btn-ghost btn-sm" href="${href}">Voir tout</a>`,
      })}
      <div class="table-wrap"><table class="tbl">
        <thead>${head}</thead>
        <tbody>${body || `<tr><td colspan="3">${emptyState()}</td></tr>`}</tbody>
      </table></div>
    </div>
  `;
}

function apartmentTile(a) {
  const cls = (a.status || "").toLowerCase();
  const subname = a.name.replace(a.id + " — ", "");
  return `
    <div class="apt">
      <span class="apt-status ${cls}">${escapeHtml(a.status)}</span>
      <span class="apt-name">${escapeHtml(a.id)}</span>
      <span class="apt-meta">${escapeHtml(subname)}</span>
      <span class="apt-meta">${fmt.money(a.price)} / nuit</span>
    </div>
  `;
}

/* =====================================================
   ENTRIES (premium)
   ===================================================== */
function renderEntries() {
  const periodEntries = state.entries.filter(e => withinPeriod(e.date) && e.paid);
  const periodAll = state.entries.filter(e => withinPeriod(e.date));
  const totalPeriod = sum(periodEntries, "amount");
  const todayEntries = state.entries.filter(e => withinPeriod(e.date, "today") && e.paid);
  const caJour = sum(todayEntries, "amount");

  const byCat = {};
  for (const e of periodEntries) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  const enAttente = state.entries.filter(e => !e.paid).reduce((a, e) => a + e.amount, 0);

  $("#view").innerHTML = `
    ${pageHead({
      title: "Entrées d’argent",
      subtitle: "Suivez les ventes restaurant, séjours appartements et livraisons encaissées.",
      actions: `
        <button class="btn btn-ghost" id="exportEntries">${icon("download")} Exporter</button>
        <button class="btn btn-gold" id="addEntry">${icon("plus")} Ajouter une entrée</button>
      `,
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: "Encaissé · " + periodLabel(currentPeriod), value: fmt.money(totalPeriod), meta: `${periodEntries.length} encaissements`, iconName: "coins" })}
      ${kpiCard({ label: "CA du jour", value: fmt.money(caJour), meta: `${todayEntries.length} aujourd’hui`, iconName: "trendingUp", accent: "alt" })}
      ${kpiCard({ label: "Catégorie principale", value: topCat ? escapeHtml(topCat[0]) : "—", meta: topCat ? fmt.moneyShort(topCat[1]) : "Aucune donnée", iconName: "tag" })}
      ${kpiCard({ label: "À encaisser", value: fmt.money(enAttente), meta: state.entries.filter(e => !e.paid).length + " en attente", iconName: "alert", accent: "paradis" })}
    </div>

    <div class="section">
      ${sectionHead({ title: "Liste des entrées", meta: `${periodAll.length} sur la période` })}
      ${filterBar("entries", [
        { key: "category", iconName: "tag", options: ["Toutes catégories", "Restaurant", "Appartements", "Livraisons", "Autre"] },
        { key: "status", iconName: "check", options: ["Tous statuts", "Encaissée", "En attente"] },
      ], "Rechercher un libellé…")}
      <div class="table-wrap" id="entriesTable"></div>
    </div>
  `;
  bindAdd("addEntry", () => entryForm());
  $("#exportEntries").addEventListener("click", () => exportCSV("entrees", state.entries, ["date", "label", "category", "amount", "paid"]));
  bindFilter("entries", drawEntriesTable);
  drawEntriesTable();
}

function drawEntriesTable() {
  const { q, filters } = readFilters("entries");
  const cat = filters.category || "Toutes catégories";
  const status = filters.status || "Tous statuts";
  const rows = state.entries.filter(e => {
    const matchQ = !q || (e.label + " " + e.category).toLowerCase().includes(q);
    const matchCat = cat === "Toutes catégories" || e.category === cat;
    const matchStatus = status === "Tous statuts" ||
      (status === "Encaissée" && e.paid) || (status === "En attente" && !e.paid);
    return matchQ && matchCat && matchStatus;
  });
  $("#entriesTable").innerHTML = `
    <table class="tbl">
      <thead><tr>
        <th>Date</th><th>Libellé</th><th>Catégorie</th><th class="num">Montant</th><th>Statut</th><th></th>
      </tr></thead>
      <tbody>
        ${rows.map(e => `
          <tr>
            <td>${fmt.date(e.date)}</td>
            <td>
              <div class="cell-icon">
                <span class="cell-avatar green"><span class="icon">${svg("arrowDownCircle")}</span></span>
                <div class="cell-content">
                  <strong>${escapeHtml(e.label)}</strong>
                </div>
              </div>
            </td>
            <td><span class="pill pill-cream">${escapeHtml(e.category)}</span></td>
            <td class="num income">${fmt.money(e.amount)}</td>
            <td>${e.paid ? `<span class="pill pill-green">${icon("check")}Encaissée</span>` : `<span class="pill pill-grey">En attente</span>`}</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm btn-icon-only" data-edit-entry="${e.id}" aria-label="Éditer">${icon("edit")}</button>
              <button class="btn btn-ghost btn-sm btn-icon-only" data-del-entry="${e.id}" aria-label="Supprimer">${icon("trash")}</button>
            </td>
          </tr>
        `).join("") || `<tr><td colspan="6">${emptyState({ message: "Aucune entrée à afficher.", hint: "Ajustez la recherche ou ajoutez une entrée." })}</td></tr>`}
      </tbody>
    </table>
  `;
  bindIcons();
  $$("[data-edit-entry]").forEach(b => b.addEventListener("click", () => entryForm(state.entries.find(x => x.id === b.dataset.editEntry))));
  $$("[data-del-entry]").forEach(b => b.addEventListener("click", () => {
    if (confirm("Supprimer cette entrée ?")) {
      DB.remove("entries", b.dataset.delEntry);
      drawEntriesTable();
      toast("Entrée supprimée");
    }
  }));
}

function entryForm(rec) {
  const isEdit = !!rec;
  openModal({
    title: isEdit ? "Modifier l’entrée" : "Nouvelle entrée",
    sub: isEdit ? rec.id : "Saisissez un encaissement",
    body: `
      <form class="form" id="entryForm">
        <div class="grid-2">
          <div class="field"><label>Date</label><input type="date" name="date" value="${fmt.dateInput(rec?.date) || today()}" required></div>
          <div class="field"><label>Catégorie</label>
            <select name="category">
              ${["Restaurant", "Appartements", "Livraisons", "Autre"].map(c =>
                `<option ${rec?.category === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field"><label>Libellé</label><input name="label" value="${escapeAttr(rec?.label || "")}" placeholder="Ex. Vente restaurant — Table 4" required></div>
        <div class="grid-2">
          <div class="field"><label>Montant (Ar)</label><input type="number" min="0" step="1000" name="amount" value="${rec?.amount ?? ""}" required></div>
          <div class="field"><label>Statut</label>
            <select name="paid">
              <option value="true" ${rec?.paid !== false ? "selected" : ""}>Encaissée</option>
              <option value="false" ${rec?.paid === false ? "selected" : ""}>En attente</option>
            </select>
          </div>
        </div>
      </form>
    `,
    buttons: [
      { label: "Annuler", class: "btn-ghost", action: closeModal },
      { label: isEdit ? "Enregistrer" : "Ajouter", class: "btn-gold", iconName: "check", action: () => {
        const data = readForm("entryForm");
        if (!data.label || !data.amount) return toast("Champs requis manquants", true);
        data.amount = Number(data.amount);
        data.paid = data.paid === "true";
        if (isEdit) DB.update("entries", rec.id, data);
        else DB.add("entries", data);
        closeModal();
        renderEntries();
        toast(isEdit ? "Entrée mise à jour" : "Entrée ajoutée");
      }},
    ],
  });
}

/* =====================================================
   EXPENSES — page premium
   ===================================================== */
function renderExpenses() {
  const periodAll = state.expenses.filter(e => withinPeriod(e.date));
  const totalPeriod = sum(periodAll, "amount");
  const todayExp = state.expenses.filter(e => withinPeriod(e.date, "today"));
  const totalToday = sum(todayExp, "amount");

  const byCat = {};
  for (const e of periodAll) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  // Solde estimé après dépenses : entrées encaissées - dépenses (sur la période)
  const periodEntries = state.entries.filter(e => withinPeriod(e.date) && e.paid);
  const ca = sum(periodEntries, "amount");
  const solde = ca - totalPeriod;

  $("#view").innerHTML = `
    ${pageHead({
      title: "Sorties / Dépenses",
      subtitle: "Suivez les charges, achats, salaires et dépenses de l’établissement.",
      actions: `
        <button class="btn btn-ghost" id="filterExpenses">${icon("filter")} Filtrer</button>
        <button class="btn btn-ghost" id="exportExpenses">${icon("download")} Exporter</button>
        <button class="btn btn-gold" id="addExpense">${icon("plus")} Ajouter une dépense</button>
      `,
    })}

    <div class="kpi-grid">
      ${kpiCard({
        label: "Dépenses · " + periodLabel(currentPeriod),
        value: fmt.money(totalPeriod),
        meta: `${periodAll.length} dépenses enregistrées`,
        iconName: "trendingDown",
      })}
      ${kpiCard({
        label: "Dépenses aujourd’hui",
        value: fmt.money(totalToday),
        meta: `${todayExp.length} mouvements aujourd’hui`,
        iconName: "receipt",
        accent: "alt",
      })}
      ${kpiCard({
        label: "Catégorie principale",
        value: topCat ? escapeHtml(topCat[0]) : "—",
        meta: topCat ? `${fmt.moneyShort(topCat[1])} sur la période` : "Aucune donnée",
        iconName: "tag",
      })}
      ${kpiCard({
        label: "Solde estimé après dépenses",
        value: fmt.money(solde),
        meta: solde >= 0
          ? `<span class="up">▲ Solde positif</span>`
          : `<span class="down">▼ Solde négatif</span>`,
        iconName: "wallet",
        accent: "paradis",
      })}
    </div>

    <div class="section">
      ${sectionHead({
        title: "Toutes les dépenses",
        meta: `<strong>${periodAll.length}</strong> sur la période · <strong>${state.expenses.length}</strong> au total`,
      })}
      ${filterBar("expenses", [
        { key: "category", iconName: "tag", options: ["Toutes catégories", "Approvisionnement", "Salaires", "Charges", "Logistique", "Entretien", "Autre"] },
        { key: "period", iconName: "calendar", options: ["Toutes périodes", "Aujourd’hui", "7 jours", "Ce mois", "Année"] },
        { key: "payment", iconName: "creditCard", options: ["Tous paiements", "Espèces", "Mobile Money", "Carte", "Virement", "Chèque"] },
      ], "Rechercher description, fournisseur…")}
      <div class="table-wrap" id="expensesTable"></div>
    </div>
  `;

  bindAdd("addExpense", () => expenseForm());
  $("#exportExpenses").addEventListener("click", () => exportCSV("depenses", state.expenses, ["date", "label", "category", "amount", "payment", "supplier", "note"]));
  $("#filterExpenses").addEventListener("click", () => {
    $('[data-search="expenses"]')?.focus();
    toast("Recherche et filtres au-dessus du tableau");
  });
  bindFilter("expenses", drawExpensesTable);
  drawExpensesTable();
}

function drawExpensesTable() {
  const { q, filters } = readFilters("expenses");
  const cat = filters.category || "Toutes catégories";
  const period = filters.period || "Toutes périodes";
  const pay = filters.payment || "Tous paiements";
  const periodMap = { "Aujourd’hui": "today", "7 jours": "week", "Ce mois": "month", "Année": "year" };

  const rows = state.expenses.filter(e => {
    const matchQ = !q || ((e.label || "") + " " + (e.category || "") + " " + (e.supplier || "") + " " + (e.note || "")).toLowerCase().includes(q);
    const matchCat = cat === "Toutes catégories" || e.category === cat;
    const matchPay = pay === "Tous paiements" || (e.payment || "") === pay;
    const matchPeriod = period === "Toutes périodes" || withinPeriod(e.date, periodMap[period]);
    return matchQ && matchCat && matchPay && matchPeriod;
  });

  const total = sum(rows, "amount");

  $("#expensesTable").innerHTML = `
    <table class="tbl">
      <thead><tr>
        <th>Date</th>
        <th>Catégorie</th>
        <th>Description</th>
        <th class="num">Montant</th>
        <th>Paiement</th>
        <th>Fournisseur</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${rows.map(e => `
          <tr>
            <td>${fmt.date(e.date)}</td>
            <td>${categoryPill(e.category)}</td>
            <td>
              <div class="cell-icon">
                <span class="cell-avatar red"><span class="icon">${svg("arrowUpCircle")}</span></span>
                <div class="cell-content">
                  <strong>${escapeHtml(e.label)}</strong>
                  ${e.note ? `<span>${escapeHtml(e.note)}</span>` : ""}
                </div>
              </div>
            </td>
            <td class="num expense">${fmt.money(e.amount)}</td>
            <td>${paymentPill(e.payment || "—")}</td>
            <td>${e.supplier ? `<span class="cell-icon">${icon("building")}<span>${escapeHtml(e.supplier)}</span></span>` : `<span style="color:var(--muted);">—</span>`}</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm btn-icon-only" data-edit-exp="${e.id}" aria-label="Éditer">${icon("edit")}</button>
              <button class="btn btn-ghost btn-sm btn-icon-only" data-del-exp="${e.id}" aria-label="Supprimer">${icon("trash")}</button>
            </td>
          </tr>
        `).join("") || `<tr><td colspan="7">${emptyState({ message: "Aucune dépense ne correspond à vos filtres.", hint: "Essayez d’élargir la période ou la catégorie." })}</td></tr>`}
      </tbody>
      ${rows.length ? `
      <tfoot>
        <tr>
          <td colspan="3" style="text-align:right; font-size:11.5px; letter-spacing:1.2px; text-transform:uppercase; color:var(--muted); font-weight:700;">Total filtré</td>
          <td class="num expense" style="font-size:15px;">${fmt.money(total)}</td>
          <td colspan="3"></td>
        </tr>
      </tfoot>` : ""}
    </table>
  `;
  bindIcons();
  $$("[data-edit-exp]").forEach(b => b.addEventListener("click", () => expenseForm(state.expenses.find(x => x.id === b.dataset.editExp))));
  $$("[data-del-exp]").forEach(b => b.addEventListener("click", () => {
    if (confirm("Supprimer cette dépense ?")) {
      DB.remove("expenses", b.dataset.delExp);
      drawExpensesTable();
      toast("Dépense supprimée");
    }
  }));
}

function expenseForm(rec) {
  const isEdit = !!rec;
  openModal({
    title: isEdit ? "Modifier la dépense" : "Ajouter une dépense",
    sub: isEdit ? "" : "Saisissez les informations de la sortie",
    body: `
      <form class="form" id="expenseForm">
        <div class="grid-2">
          <div class="field"><label>Date</label><input type="date" name="date" value="${fmt.dateInput(rec?.date) || today()}" required></div>
          <div class="field"><label>Catégorie</label>
            <select name="category">
              ${["Approvisionnement", "Salaires", "Charges", "Logistique", "Entretien", "Autre"]
                .map(c => `<option ${rec?.category === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field"><label>Description</label><input name="label" value="${escapeAttr(rec?.label || "")}" placeholder="Ex. Achat marchandises (légumes & viande)" required></div>
        <div class="grid-2">
          <div class="field"><label>Montant (Ar)</label><input type="number" min="0" step="1000" name="amount" value="${rec?.amount ?? ""}" required></div>
          <div class="field"><label>Mode de paiement</label>
            <select name="payment">
              ${["Espèces", "Mobile Money", "Carte", "Virement", "Chèque"].map(p => `<option ${rec?.payment === p ? "selected" : ""}>${p}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field"><label>Fournisseur</label><input name="supplier" value="${escapeAttr(rec?.supplier || "")}" placeholder="Ex. Marché d’Analakely"></div>
        <div class="field"><label>Note (facultatif)</label><textarea name="note" placeholder="Précisions, n° de pièce, contexte…">${escapeHtml(rec?.note || "")}</textarea></div>
      </form>
    `,
    buttons: [
      { label: "Annuler", class: "btn-ghost", action: closeModal },
      { label: isEdit ? "Enregistrer" : "Enregistrer la dépense", class: "btn-gold", iconName: "check", action: () => {
        const data = readForm("expenseForm");
        if (!data.label || !data.amount) return toast("Description et montant requis", true);
        data.amount = Number(data.amount);
        if (isEdit) DB.update("expenses", rec.id, data);
        else DB.add("expenses", data);
        closeModal();
        renderExpenses();
        toast(isEdit ? "Dépense mise à jour" : "Dépense ajoutée");
      }},
    ],
  });
}

function categoryPill(c) {
  const map = {
    "Approvisionnement": "pill-gold",
    "Salaires": "pill-paradis",
    "Charges": "pill-grey",
    "Logistique": "pill-cream",
    "Entretien": "pill-red",
    "Autre": "pill-cream",
  };
  return `<span class="pill ${map[c] || "pill-cream"}">${escapeHtml(c || "—")}</span>`;
}

function paymentPill(p) {
  const icons = {
    "Espèces": "banknote",
    "Mobile Money": "smartphone",
    "Carte": "creditCard",
    "Virement": "wallet",
    "Chèque": "fileText",
  };
  return `<span class="pill pill-cream">${icon(icons[p] || "wallet")}${escapeHtml(p)}</span>`;
}

/* =====================================================
   ORDERS
   ===================================================== */
function renderOrders() {
  const inProgress = state.orders.filter(o => ["En préparation", "En attente", "Prête"].includes(o.status)).length;
  const delivered = state.orders.filter(o => o.status === "Livrée").length;
  const totalAmount = sum(state.orders.filter(o => o.status !== "Annulée"), "amount");

  $("#view").innerHTML = `
    ${pageHead({
      title: "Commandes",
      subtitle: "Suivi des commandes restaurant et à emporter.",
      actions: `<button class="btn btn-gold" id="addOrder">${icon("plus")} Nouvelle commande</button>`,
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: "Total commandes", value: state.orders.length, iconName: "shoppingBag" })}
      ${kpiCard({ label: "En cours", value: inProgress, iconName: "refresh", accent: "alt" })}
      ${kpiCard({ label: "Livrées", value: delivered, iconName: "check" })}
      ${kpiCard({ label: "Chiffre d’affaires", value: fmt.money(totalAmount), iconName: "coins", accent: "paradis" })}
    </div>

    <div class="section">
      ${sectionHead({ title: "Liste des commandes" })}
      ${filterBar("orders", [
        { key: "status", iconName: "tag", options: ["Tous statuts", "En attente", "En préparation", "Prête", "Livrée", "Annulée"] },
      ], "Rechercher n°, client, articles…")}
      <div class="table-wrap" id="ordersTable"></div>
    </div>
  `;
  bindAdd("addOrder", () => orderForm());
  bindFilter("orders", drawOrdersTable);
  drawOrdersTable();
}

function drawOrdersTable() {
  const { q, filters } = readFilters("orders");
  const status = filters.status || "Tous statuts";
  const rows = state.orders.filter(o => {
    const matchQ = !q || ((o.id || "") + " " + (o.client || "") + " " + (o.items || "")).toLowerCase().includes(q);
    const matchStatus = status === "Tous statuts" || o.status === status;
    return matchQ && matchStatus;
  });
  $("#ordersTable").innerHTML = `
    <table class="tbl">
      <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Articles</th><th>Statut</th><th class="num">Montant</th><th></th></tr></thead>
      <tbody>
        ${rows.map(o => `
          <tr>
            <td><span class="ref">${o.id}</span></td>
            <td>${fmt.date(o.date)}</td>
            <td>${escapeHtml(o.client || "—")}</td>
            <td>${escapeHtml(o.items || "—")}</td>
            <td>${orderStatusPill(o.status)}</td>
            <td class="num">${fmt.money(o.amount)}</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm btn-icon-only" data-edit-order="${o.id}">${icon("edit")}</button>
              <button class="btn btn-ghost btn-sm btn-icon-only" data-del-order="${o.id}">${icon("trash")}</button>
            </td>
          </tr>
        `).join("") || `<tr><td colspan="7">${emptyState()}</td></tr>`}
      </tbody>
    </table>
  `;
  bindIcons();
  $$("[data-edit-order]").forEach(b => b.addEventListener("click", () => orderForm(state.orders.find(x => x.id === b.dataset.editOrder))));
  $$("[data-del-order]").forEach(b => b.addEventListener("click", () => {
    if (confirm("Supprimer cette commande ?")) {
      DB.remove("orders", b.dataset.delOrder);
      drawOrdersTable();
      toast("Commande supprimée");
    }
  }));
}

function orderForm(rec) {
  const isEdit = !!rec;
  openModal({
    title: isEdit ? "Modifier la commande" : "Nouvelle commande",
    sub: isEdit ? rec.id : "",
    body: `
      <form class="form" id="orderForm">
        <div class="grid-2">
          <div class="field"><label>N°</label><input name="id" value="${escapeAttr(rec?.id || nextOrderId())}" required></div>
          <div class="field"><label>Date</label><input type="date" name="date" value="${fmt.dateInput(rec?.date) || today()}" required></div>
        </div>
        <div class="field"><label>Client</label><input name="client" value="${escapeAttr(rec?.client || "")}"></div>
        <div class="field"><label>Articles</label><input name="items" value="${escapeAttr(rec?.items || "")}" placeholder="Ex. Menu du jour x2"></div>
        <div class="grid-2">
          <div class="field"><label>Statut</label>
            <select name="status">
              ${["En attente", "En préparation", "Prête", "Livrée", "Annulée"].map(s => `<option ${rec?.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>Montant (Ar)</label><input type="number" min="0" step="1000" name="amount" value="${rec?.amount ?? ""}" required></div>
        </div>
      </form>
    `,
    buttons: [
      { label: "Annuler", class: "btn-ghost", action: closeModal },
      { label: isEdit ? "Enregistrer" : "Ajouter", class: "btn-gold", iconName: "check", action: () => {
        const data = readForm("orderForm");
        data.amount = Number(data.amount);
        if (isEdit) DB.update("orders", rec.id, data);
        else DB.add("orders", data);
        closeModal();
        renderOrders();
        toast(isEdit ? "Commande mise à jour" : "Commande ajoutée");
      }},
    ],
  });
}

function nextOrderId() {
  const nums = state.orders.map(o => parseInt(String(o.id).replace(/\D/g, ""), 10)).filter(Number.isFinite);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "CMD-" + String(next).padStart(5, "0");
}

function orderStatusPill(s) {
  const map = {
    "En attente": "pill-grey",
    "En préparation": "pill-gold",
    "Prête": "pill-paradis",
    "Livrée": "pill-green",
    "Annulée": "pill-red",
    "En cours": "pill-gold",
  };
  return `<span class="pill ${map[s] || "pill-cream"}">${escapeHtml(s)}</span>`;
}

/* =====================================================
   DELIVERIES
   ===================================================== */
function renderDeliveries() {
  const enCours = state.deliveries.filter(d => d.status === "En cours").length;
  const livrees = state.deliveries.filter(d => d.status === "Livrée").length;
  const totalAmount = sum(state.deliveries.filter(d => d.status !== "Annulée"), "amount");

  $("#view").innerHTML = `
    ${pageHead({
      title: "Livraisons",
      subtitle: "Suivez les livraisons en cours et leur historique.",
      actions: `<button class="btn btn-gold" id="addDelivery">${icon("plus")} Nouvelle livraison</button>`,
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: "Total livraisons", value: state.deliveries.length, iconName: "truck" })}
      ${kpiCard({ label: "En cours", value: enCours, iconName: "refresh", accent: "alt" })}
      ${kpiCard({ label: "Livrées", value: livrees, iconName: "check" })}
      ${kpiCard({ label: "Chiffre d’affaires", value: fmt.money(totalAmount), iconName: "coins", accent: "paradis" })}
    </div>

    <div class="section">
      ${sectionHead({ title: "Liste des livraisons" })}
      ${filterBar("deliveries", [
        { key: "status", iconName: "tag", options: ["Tous statuts", "En cours", "Livrée", "Annulée"] },
      ], "Rechercher n°, client, adresse…")}
      <div class="table-wrap" id="deliveriesTable"></div>
    </div>
  `;
  bindAdd("addDelivery", () => deliveryForm());
  bindFilter("deliveries", drawDeliveriesTable);
  drawDeliveriesTable();
}

function drawDeliveriesTable() {
  const { q, filters } = readFilters("deliveries");
  const status = filters.status || "Tous statuts";
  const rows = state.deliveries.filter(d => {
    const matchQ = !q || ((d.id || "") + " " + (d.client || "") + " " + (d.address || "")).toLowerCase().includes(q);
    const matchStatus = status === "Tous statuts" || d.status === status;
    return matchQ && matchStatus;
  });
  $("#deliveriesTable").innerHTML = `
    <table class="tbl">
      <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Adresse</th><th>Statut</th><th class="num">Montant</th><th></th></tr></thead>
      <tbody>
        ${rows.map(d => `
          <tr>
            <td><span class="ref">${d.id}</span></td>
            <td>${fmt.date(d.date)}</td>
            <td>${escapeHtml(d.client || "—")}</td>
            <td>${escapeHtml(d.address || "—")}</td>
            <td>${orderStatusPill(d.status)}</td>
            <td class="num">${fmt.money(d.amount)}</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm btn-icon-only" data-edit-del="${d.id}">${icon("edit")}</button>
              <button class="btn btn-ghost btn-sm btn-icon-only" data-del-del="${d.id}">${icon("trash")}</button>
            </td>
          </tr>
        `).join("") || `<tr><td colspan="7">${emptyState()}</td></tr>`}
      </tbody>
    </table>
  `;
  bindIcons();
  $$("[data-edit-del]").forEach(b => b.addEventListener("click", () => deliveryForm(state.deliveries.find(x => x.id === b.dataset.editDel))));
  $$("[data-del-del]").forEach(b => b.addEventListener("click", () => {
    if (confirm("Supprimer cette livraison ?")) {
      DB.remove("deliveries", b.dataset.delDel);
      drawDeliveriesTable();
      toast("Livraison supprimée");
    }
  }));
}

function deliveryForm(rec) {
  const isEdit = !!rec;
  openModal({
    title: isEdit ? "Modifier la livraison" : "Nouvelle livraison",
    sub: isEdit ? rec.id : "",
    body: `
      <form class="form" id="deliveryForm">
        <div class="grid-2">
          <div class="field"><label>N°</label><input name="id" value="${escapeAttr(rec?.id || nextDeliveryId())}" required></div>
          <div class="field"><label>Date</label><input type="date" name="date" value="${fmt.dateInput(rec?.date) || today()}" required></div>
        </div>
        <div class="field"><label>Client</label><input name="client" value="${escapeAttr(rec?.client || "")}"></div>
        <div class="field"><label>Adresse</label><input name="address" value="${escapeAttr(rec?.address || "")}"></div>
        <div class="grid-2">
          <div class="field"><label>Statut</label>
            <select name="status">
              ${["En cours", "Livrée", "Annulée"].map(s => `<option ${rec?.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>Montant (Ar)</label><input type="number" min="0" step="1000" name="amount" value="${rec?.amount ?? ""}" required></div>
        </div>
      </form>
    `,
    buttons: [
      { label: "Annuler", class: "btn-ghost", action: closeModal },
      { label: isEdit ? "Enregistrer" : "Ajouter", class: "btn-gold", iconName: "check", action: () => {
        const data = readForm("deliveryForm");
        data.amount = Number(data.amount);
        if (isEdit) DB.update("deliveries", rec.id, data);
        else DB.add("deliveries", data);
        closeModal();
        renderDeliveries();
        toast(isEdit ? "Livraison mise à jour" : "Livraison ajoutée");
      }},
    ],
  });
}

function nextDeliveryId() {
  const nums = state.deliveries.map(o => parseInt(String(o.id).replace(/\D/g, ""), 10)).filter(Number.isFinite);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "LIV-" + String(next).padStart(5, "0");
}

/* =====================================================
   APARTMENTS
   ===================================================== */
function renderApartments() {
  const total = state.apartments.length;
  const dispo = state.apartments.filter(a => a.status === "Disponible").length;
  const occ = state.apartments.filter(a => a.status === "Occupé").length;
  const res = state.apartments.filter(a => a.status === "Réservé").length;
  const main = state.apartments.filter(a => a.status === "Maintenance").length;
  const occRate = total ? Math.round((occ / total) * 100) : 0;

  $("#view").innerHTML = `
    ${pageHead({
      title: "Appartements",
      subtitle: "État en temps réel des suites et studios de la résidence.",
      actions: `<button class="btn btn-gold" id="addApt">${icon("plus")} Ajouter un appartement</button>`,
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: "Disponibles", value: `${dispo} / ${total}`, iconName: "bed" })}
      ${kpiCard({ label: "Occupés", value: occ, meta: `${occRate}% d’occupation`, iconName: "users", accent: "alt" })}
      ${kpiCard({ label: "Réservés", value: res, iconName: "calendar" })}
      ${kpiCard({ label: "Maintenance", value: main, iconName: "settings", accent: "paradis" })}
    </div>

    <div class="section">
      ${sectionHead({ title: "Toutes les unités" })}
      ${filterBar("apartments", [
        { key: "status", iconName: "tag", options: ["Tous statuts", "Disponible", "Occupé", "Réservé", "Maintenance"] },
      ], "Rechercher code, nom, note…")}
      <div class="apt-grid" id="aptGrid" style="margin-top:6px;"></div>
    </div>
  `;
  bindAdd("addApt", () => aptForm());
  bindFilter("apartments", drawApartments);
  drawApartments();
}

function drawApartments() {
  const { q, filters } = readFilters("apartments");
  const status = filters.status || "Tous statuts";
  const rows = state.apartments.filter(a => {
    const matchQ = !q || (a.id + " " + a.name + " " + (a.note || "")).toLowerCase().includes(q);
    const matchStatus = status === "Tous statuts" || a.status === status;
    return matchQ && matchStatus;
  });
  $("#aptGrid").innerHTML = rows.length ? rows.map(a => {
    const cls = (a.status || "").toLowerCase();
    const subname = a.name.replace(a.id + " — ", "");
    return `
      <div class="apt">
        <span class="apt-status ${cls}">${escapeHtml(a.status)}</span>
        <span class="apt-name">${escapeHtml(a.id)}</span>
        <span class="apt-meta">${escapeHtml(subname)}</span>
        <span class="apt-meta"><strong style="color:var(--paradis-dark);">${fmt.money(a.price)}</strong> / nuit</span>
        ${a.note ? `<span class="apt-meta" style="font-style:italic;">${escapeHtml(a.note)}</span>` : ""}
        <div class="apt-row-actions">
          <button class="btn btn-ghost btn-sm btn-icon-only" data-edit-apt="${a.id}">${icon("edit")}</button>
          <button class="btn btn-ghost btn-sm btn-icon-only" data-del-apt="${a.id}">${icon("trash")}</button>
        </div>
      </div>
    `;
  }).join("") : emptyState({ message: "Aucune unité ne correspond aux filtres." });

  bindIcons();
  $$("[data-edit-apt]").forEach(b => b.addEventListener("click", () => aptForm(state.apartments.find(x => x.id === b.dataset.editApt))));
  $$("[data-del-apt]").forEach(b => b.addEventListener("click", () => {
    if (confirm("Supprimer cet appartement ?")) {
      DB.remove("apartments", b.dataset.delApt);
      drawApartments();
      toast("Appartement supprimé");
    }
  }));
}

function aptForm(rec) {
  const isEdit = !!rec;
  openModal({
    title: isEdit ? "Modifier l’appartement" : "Nouvel appartement",
    sub: isEdit ? rec.id : "",
    body: `
      <form class="form" id="aptForm">
        <div class="grid-2">
          <div class="field"><label>Code</label><input name="id" value="${escapeAttr(rec?.id || "")}" required></div>
          <div class="field"><label>Statut</label>
            <select name="status">
              ${["Disponible", "Occupé", "Réservé", "Maintenance"].map(s => `<option ${rec?.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field"><label>Nom complet</label><input name="name" value="${escapeAttr(rec?.name || "")}" required></div>
        <div class="grid-2">
          <div class="field"><label>Prix / nuit (Ar)</label><input type="number" min="0" step="1000" name="price" value="${rec?.price ?? ""}" required></div>
          <div class="field"><label>Note</label><input name="note" value="${escapeAttr(rec?.note || "")}"></div>
        </div>
      </form>
    `,
    buttons: [
      { label: "Annuler", class: "btn-ghost", action: closeModal },
      { label: isEdit ? "Enregistrer" : "Ajouter", class: "btn-gold", iconName: "check", action: () => {
        const data = readForm("aptForm");
        data.price = Number(data.price);
        if (isEdit) DB.update("apartments", rec.id, data);
        else DB.add("apartments", data);
        closeModal();
        renderApartments();
        toast(isEdit ? "Appartement mis à jour" : "Appartement ajouté");
      }},
    ],
  });
}

/* =====================================================
   INVOICES (premium)
   ===================================================== */
function renderInvoices() {
  const totalAll = sum(state.invoices, "amount");
  const totalPaid = state.invoices.reduce((a, f) => a + (f.paid || 0), 0);
  const totalDue = totalAll - totalPaid;
  const impayees = state.invoices.filter(f => f.status !== "Payée").length;

  $("#view").innerHTML = `
    ${pageHead({
      title: "Factures",
      subtitle: "Émettez et suivez les factures de l’établissement.",
      actions: `
        <button class="btn btn-ghost" id="exportInv">${icon("download")} Exporter</button>
        <button class="btn btn-gold" id="addInvoice">${icon("plus")} Nouvelle facture</button>
      `,
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: "Total facturé", value: fmt.money(totalAll), meta: state.invoices.length + " factures", iconName: "fileText" })}
      ${kpiCard({ label: "Encaissé", value: fmt.money(totalPaid), iconName: "check", accent: "alt" })}
      ${kpiCard({ label: "Reste à encaisser", value: fmt.money(totalDue), meta: impayees + " factures non soldées", iconName: "alert", accent: "paradis" })}
      ${kpiCard({ label: "Taux d’encaissement", value: totalAll ? Math.round((totalPaid / totalAll) * 100) + " %" : "—", iconName: "trendingUp" })}
    </div>

    <div class="section">
      ${sectionHead({ title: "Toutes les factures" })}
      ${filterBar("invoices", [
        { key: "status", iconName: "tag", options: ["Tous statuts", "Payée", "Partielle", "Impayée"] },
      ], "Rechercher n°, client, note…")}
      <div class="table-wrap" id="invoicesTable"></div>
    </div>
  `;
  bindAdd("addInvoice", () => invoiceForm());
  $("#exportInv").addEventListener("click", () => exportCSV("factures", state.invoices, ["id", "date", "client", "amount", "paid", "status", "note"]));
  bindFilter("invoices", drawInvoicesTable);
  drawInvoicesTable();
}

function drawInvoicesTable() {
  const { q, filters } = readFilters("invoices");
  const status = filters.status || "Tous statuts";
  const rows = state.invoices.filter(f => {
    const matchQ = !q || ((f.id || "") + " " + (f.client || "") + " " + (f.note || "")).toLowerCase().includes(q);
    const matchStatus = status === "Tous statuts" || f.status === status;
    return matchQ && matchStatus;
  });
  $("#invoicesTable").innerHTML = `
    <table class="tbl">
      <thead><tr><th>N°</th><th>Date</th><th>Client</th><th class="num">Montant</th><th class="num">Payé</th><th class="num">Reste</th><th>Statut</th><th></th></tr></thead>
      <tbody>
        ${rows.map(f => {
          const due = f.amount - (f.paid || 0);
          return `
            <tr>
              <td><span class="ref">${f.id}</span></td>
              <td>${fmt.date(f.date)}</td>
              <td>
                <div class="cell-icon">
                  <span class="cell-avatar"><span class="icon">${svg("users")}</span></span>
                  <div class="cell-content">
                    <strong>${escapeHtml(f.client || "—")}</strong>
                    ${f.note ? `<span>${escapeHtml(f.note)}</span>` : ""}
                  </div>
                </div>
              </td>
              <td class="num">${fmt.money(f.amount)}</td>
              <td class="num income">${fmt.money(f.paid || 0)}</td>
              <td class="num expense">${fmt.money(due)}</td>
              <td>${invoiceStatusPill(f.status)}</td>
              <td class="row-actions">
                <button class="btn btn-ghost btn-sm btn-icon-only" data-view-inv="${f.id}" aria-label="Voir">${icon("eye")}</button>
                ${f.status !== "Payée" ? `<button class="btn btn-paradis btn-sm" data-pay-inv="${f.id}">${icon("check")} Marquer payée</button>` : ""}
                <button class="btn btn-ghost btn-sm btn-icon-only" data-edit-inv="${f.id}" aria-label="Éditer">${icon("edit")}</button>
                <button class="btn btn-ghost btn-sm btn-icon-only" data-del-inv="${f.id}" aria-label="Supprimer">${icon("trash")}</button>
              </td>
            </tr>
          `;
        }).join("") || `<tr><td colspan="8">${emptyState()}</td></tr>`}
      </tbody>
    </table>
  `;
  bindIcons();
  $$("[data-edit-inv]").forEach(b => b.addEventListener("click", () => invoiceForm(state.invoices.find(x => x.id === b.dataset.editInv))));
  $$("[data-pay-inv]").forEach(b => b.addEventListener("click", () => {
    const rec = state.invoices.find(x => x.id === b.dataset.payInv);
    DB.update("invoices", rec.id, { paid: rec.amount, status: "Payée" });
    drawInvoicesTable();
    toast("Facture marquée comme payée");
  }));
  $$("[data-del-inv]").forEach(b => b.addEventListener("click", () => {
    if (confirm("Supprimer cette facture ?")) {
      DB.remove("invoices", b.dataset.delInv);
      drawInvoicesTable();
      toast("Facture supprimée");
    }
  }));
  $$("[data-view-inv]").forEach(b => b.addEventListener("click", () => viewInvoice(state.invoices.find(x => x.id === b.dataset.viewInv))));
}

function invoiceStatusPill(s) {
  const map = { "Payée": "pill-green", "Partielle": "pill-gold", "Impayée": "pill-red" };
  return `<span class="pill ${map[s] || "pill-cream"}">${escapeHtml(s)}</span>`;
}

function invoiceForm(rec) {
  const isEdit = !!rec;
  const number = rec?.id || DB.nextInvoiceNumber();
  openModal({
    title: isEdit ? "Modifier la facture" : "Nouvelle facture",
    sub: isEdit ? "" : number,
    body: `
      <form class="form" id="invoiceForm">
        <div class="grid-2">
          <div class="field"><label>N°</label><input name="id" value="${escapeAttr(number)}" required ${isEdit ? "" : "readonly"}></div>
          <div class="field"><label>Date</label><input type="date" name="date" value="${fmt.dateInput(rec?.date) || today()}" required></div>
        </div>
        <div class="field"><label>Client</label><input name="client" value="${escapeAttr(rec?.client || "")}" required></div>
        <div class="grid-2">
          <div class="field"><label>Montant (Ar)</label><input type="number" min="0" step="1000" name="amount" value="${rec?.amount ?? ""}" required></div>
          <div class="field"><label>Payé (Ar)</label><input type="number" min="0" step="1000" name="paid" value="${rec?.paid ?? 0}" required></div>
        </div>
        <div class="field"><label>Note</label><input name="note" value="${escapeAttr(rec?.note || "")}"></div>
      </form>
    `,
    buttons: [
      { label: "Annuler", class: "btn-ghost", action: closeModal },
      { label: isEdit ? "Enregistrer" : "Créer", class: "btn-gold", iconName: "check", action: () => {
        const data = readForm("invoiceForm");
        data.amount = Number(data.amount);
        data.paid = Number(data.paid);
        data.status = data.paid >= data.amount ? "Payée" : (data.paid > 0 ? "Partielle" : "Impayée");
        if (isEdit) DB.update("invoices", rec.id, data);
        else DB.add("invoices", data);
        closeModal();
        renderInvoices();
        toast(isEdit ? "Facture mise à jour" : "Facture créée");
      }},
    ],
  });
}

function viewInvoice(f) {
  if (!f) return;
  const due = f.amount - (f.paid || 0);
  openModal({
    title: `Facture ${f.id}`,
    sub: state.settings.establishment,
    wide: true,
    body: `
      <div style="font-family:var(--font-display); font-size:22px; color:var(--paradis-dark); margin-bottom:4px;">
        ${escapeHtml(state.settings.establishment || "Le Paradisier")}
      </div>
      <p style="color:var(--muted); margin:0 0 18px; letter-spacing:1.4px; text-transform:uppercase; font-size:11px; font-weight:600;">${escapeHtml(state.settings.tagline || "")}</p>
      <table class="tbl" style="margin-bottom:14px;">
        <tbody>
          <tr><th>N°</th><td><span class="ref">${f.id}</span></td></tr>
          <tr><th>Date</th><td>${fmt.date(f.date)}</td></tr>
          <tr><th>Client</th><td>${escapeHtml(f.client || "—")}</td></tr>
          <tr><th>Description</th><td>${escapeHtml(f.note || "—")}</td></tr>
          <tr><th>Montant</th><td class="num">${fmt.money(f.amount)}</td></tr>
          <tr><th>Payé</th><td class="num income">${fmt.money(f.paid || 0)}</td></tr>
          <tr><th>Reste à payer</th><td class="num expense">${fmt.money(due)}</td></tr>
          <tr><th>Statut</th><td>${invoiceStatusPill(f.status)}</td></tr>
        </tbody>
      </table>
    `,
    buttons: [
      { label: "Imprimer", class: "btn-ghost", iconName: "printer", action: () => window.print() },
      { label: "Fermer", class: "btn-paradis", action: closeModal },
    ],
  });
}

/* =====================================================
   REPORTS
   ===================================================== */
function renderReports() {
  const periodEntries = state.entries.filter(e => withinPeriod(e.date) && e.paid);
  const periodExpenses = state.expenses.filter(e => withinPeriod(e.date));

  const ca = sum(periodEntries, "amount");
  const out = sum(periodExpenses, "amount");
  const profit = ca - out;

  const byCatIn = groupSum(periodEntries, "category", "amount");
  const byCatOut = groupSum(periodExpenses, "category", "amount");

  const totalApts = state.apartments.length;
  const occ = state.apartments.filter(a => a.status === "Occupé").length;
  const occRate = totalApts ? Math.round((occ / totalApts) * 100) : 0;
  const due = state.invoices.reduce((acc, f) => acc + (f.amount - (f.paid || 0)), 0);

  $("#view").innerHTML = `
    ${pageHead({
      title: "Rapports",
      subtitle: `Synthèse de l’activité — ${periodLabel(currentPeriod)}.`,
      actions: `<button class="btn btn-gold" id="reportExportBtn">${icon("download")} Exporter le rapport</button>`,
    })}

    <div class="kpi-grid">
      ${kpiCard({ label: "Chiffre d’affaires", value: fmt.money(ca), iconName: "trendingUp" })}
      ${kpiCard({ label: "Sorties", value: fmt.money(out), iconName: "trendingDown", accent: "alt" })}
      ${kpiCard({ label: "Bénéfice", value: fmt.money(profit), iconName: "sparkles", accent: "paradis" })}
      ${kpiCard({ label: "Occupation", value: occRate + " %", meta: `${occ} / ${totalApts} occupés`, iconName: "bed" })}
      ${kpiCard({ label: "Reste à encaisser", value: fmt.money(due), iconName: "alert" })}
    </div>

    <div class="cols-2">
      <div class="section">
        ${sectionHead({ title: "Entrées par activité" })}
        ${barListHTML(byCatIn)}
      </div>
      <div class="section">
        ${sectionHead({ title: "Sorties par catégorie" })}
        ${barListHTML(byCatOut)}
      </div>
    </div>

    <div class="section">
      ${sectionHead({ title: "Synthèse complète" })}
      <table class="tbl">
        <tbody>
          <tr><th>Période</th><td>${periodLabel(currentPeriod)}</td></tr>
          <tr><th>Entrées encaissées</th><td class="num income">${fmt.money(ca)}</td></tr>
          <tr><th>Sorties</th><td class="num expense">${fmt.money(out)}</td></tr>
          <tr><th>Bénéfice estimé</th><td class="num">${fmt.money(profit)}</td></tr>
          <tr><th>Commandes</th><td>${state.orders.filter(o => withinPeriod(o.date)).length}</td></tr>
          <tr><th>Livraisons</th><td>${state.deliveries.filter(d => withinPeriod(d.date)).length}</td></tr>
          <tr><th>Appartements occupés</th><td>${occ} / ${totalApts}</td></tr>
          <tr><th>Factures impayées</th><td>${state.invoices.filter(f => f.status !== "Payée").length}</td></tr>
        </tbody>
      </table>
    </div>
  `;
  $("#reportExportBtn").addEventListener("click", exportReport);
}

function barListHTML(map) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return emptyState({ message: "Aucune donnée pour cette période." });
  const max = Math.max(...entries.map(([, v]) => v));
  return `<div class="donut-list">${entries.map(([k, v]) => `
    <div class="donut-row">
      <div class="top"><span>${escapeHtml(k)}</span><span>${fmt.money(v)}</span></div>
      <div class="donut-track"><div class="donut-fill" style="width:${(v / max) * 100}%"></div></div>
    </div>
  `).join("")}</div>`;
}

function periodLabel(p) {
  return { today: "Aujourd’hui", week: "7 derniers jours", month: "Ce mois", year: "Cette année" }[p] || p;
}

/* =====================================================
   SETTINGS
   ===================================================== */
function renderSettings() {
  const s = state.settings;
  $("#view").innerHTML = `
    ${pageHead({
      title: "Paramètres",
      subtitle: "Personnalisez les informations de votre établissement.",
    })}

    <div class="section">
      ${sectionHead({ title: "Établissement" })}
      <form class="form" id="settingsForm" style="max-width:620px;">
        <div class="grid-2">
          <div class="field"><label>Nom</label><input name="establishment" value="${escapeAttr(s.establishment)}"></div>
          <div class="field"><label>Devise</label><input name="currency" value="${escapeAttr(s.currency)}"></div>
        </div>
        <div class="field"><label>Sous-titre</label><input name="tagline" value="${escapeAttr(s.tagline)}"></div>
        <div class="grid-2">
          <div class="field"><label>Gérant</label><input name="manager" value="${escapeAttr(s.manager)}"></div>
          <div class="field"><label>Locale</label><input name="locale" value="${escapeAttr(s.locale)}"></div>
        </div>
        <div style="margin-top:8px;">
          <button type="button" class="btn btn-gold" id="saveSettings">${icon("check")} Enregistrer</button>
        </div>
      </form>
    </div>
  `;
  $("#saveSettings").addEventListener("click", () => {
    const data = readForm("settingsForm");
    state.settings = { ...state.settings, ...data };
    DB.save();
    toast("Paramètres enregistrés");
    navigate("settings");
  });
}

/* =====================================================
   BACKUP
   ===================================================== */
function renderBackup() {
  $("#view").innerHTML = `
    ${pageHead({
      title: "Sauvegarde",
      subtitle: "Exportez, importez ou réinitialisez l’ensemble de vos données locales.",
    })}

    <div class="cols-2">
      <div class="section">
        ${sectionHead({ title: "Exporter les données" })}
        <p style="color:var(--muted); margin: 0 0 14px;">Téléchargez un fichier JSON contenant l’ensemble de vos données pour les conserver hors-ligne.</p>
        <button class="btn btn-gold" id="btnExport">${icon("download")} Télécharger le fichier JSON</button>
      </div>
      <div class="section">
        ${sectionHead({ title: "Importer un fichier" })}
        <p style="color:var(--muted); margin: 0 0 14px;">Restaurez l’application à partir d’un fichier JSON exporté précédemment.</p>
        <div class="field" style="margin-bottom:12px;">
          <label>Fichier JSON</label>
          <input type="file" id="fileImport" accept="application/json">
        </div>
        <button class="btn btn-paradis" id="btnImport">${icon("upload")} Importer</button>
      </div>
    </div>

    <div class="section">
      ${sectionHead({ title: "Réinitialiser" })}
      <p style="color:var(--muted); margin: 0 0 14px;">Cette action remplace toutes les données par les données de démonstration. Elle ne peut pas être annulée.</p>
      <button class="btn btn-danger" id="btnReset">${icon("refresh")} Réinitialiser les données</button>
    </div>
  `;
  $("#btnExport").addEventListener("click", () => {
    const blob = new Blob([DB.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paradisier-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Sauvegarde téléchargée");
  });
  $("#btnImport").addEventListener("click", () => {
    const f = $("#fileImport").files?.[0];
    if (!f) return toast("Sélectionnez un fichier JSON", true);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        DB.importJSON(e.target.result);
        state = DB.state;
        toast("Données importées avec succès");
        navigate("dashboard");
      } catch (err) {
        toast("Échec de l’import : " + err.message, true);
      }
    };
    reader.readAsText(f);
  });
  $("#btnReset").addEventListener("click", () => {
    if (!confirm("Réinitialiser toutes les données ? Cette action est irréversible.")) return;
    DB.reset();
    state = DB.state;
    toast("Données réinitialisées");
    navigate("dashboard");
  });
}

/* =====================================================
   Modal / Toast / Misc
   ===================================================== */
function openModal({ title, sub = "", body, buttons = [], wide = false }) {
  $("#modalTitle").textContent = title;
  $("#modalSub").textContent = sub || "";
  $("#modalBody").innerHTML = body;
  $("#modalCard").classList.toggle("wide", !!wide);
  $("#modalFoot").innerHTML = "";
  for (const btn of buttons) {
    const b = document.createElement("button");
    b.className = `btn ${btn.class || "btn-ghost"}`;
    b.innerHTML = `${btn.iconName ? icon(btn.iconName) : ""}${escapeHtml(btn.label)}`;
    b.addEventListener("click", btn.action);
    $("#modalFoot").appendChild(b);
  }
  $("#modal").hidden = false;
  bindIcons($("#modal"));
  // Focus first input
  setTimeout(() => $("#modalBody input, #modalBody select, #modalBody textarea")?.focus(), 30);
}
function closeModal() { $("#modal").hidden = true; }

let toastTimer;
function toast(msg, isError = false) {
  const el = $("#toast");
  el.innerHTML = `${svg(isError ? "alert" : "check")}<span>${escapeHtml(msg)}</span>`;
  el.classList.toggle("error", isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
}

function readForm(formId) {
  const form = document.getElementById(formId);
  const data = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    data[el.name] = el.value;
  }
  return data;
}

function sum(arr, key) { return arr.reduce((a, x) => a + (Number(x[key]) || 0), 0); }
function groupSum(arr, k, vk) {
  const out = {};
  for (const r of arr) out[r[k]] = (out[r[k]] || 0) + (Number(r[vk]) || 0);
  return out;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

/* ----- Export helpers ----- */
function exportReport() {
  const periodEntries = state.entries.filter(e => withinPeriod(e.date) && e.paid);
  const periodExpenses = state.expenses.filter(e => withinPeriod(e.date));
  const ca = sum(periodEntries, "amount");
  const out = sum(periodExpenses, "amount");
  const lines = [
    `Le Paradisier — Rapport ${periodLabel(currentPeriod)}`,
    `Généré le ${new Date().toLocaleString("fr-FR")}`,
    ``,
    `Chiffre d’affaires : ${fmt.money(ca)}`,
    `Sorties : ${fmt.money(out)}`,
    `Bénéfice : ${fmt.money(ca - out)}`,
    ``,
    `Commandes : ${state.orders.filter(o => withinPeriod(o.date)).length}`,
    `Livraisons : ${state.deliveries.filter(d => withinPeriod(d.date)).length}`,
    `Appartements occupés : ${state.apartments.filter(a => a.status === "Occupé").length} / ${state.apartments.length}`,
    `Factures impayées : ${state.invoices.filter(f => f.status !== "Payée").length}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `paradisier-rapport-${today()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Rapport exporté");
}

function exportCSV(filename, rows, fields) {
  const escape = v => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const csv = [fields.join(";")].concat(rows.map(r => fields.map(f => escape(r[f])).join(";"))).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `paradisier-${filename}-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Fichier CSV exporté");
}
