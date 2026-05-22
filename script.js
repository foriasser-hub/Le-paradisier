/* ===========================================================
   Le Paradisier Manager — Application logic (script.js)
   - Router (hash-based)
   - Dashboard rendering
   - CRUD modules
   - Invoices (numbering, payments, print)
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
  date(s) {
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  },
  dateInput(s) {
    if (!s) return "";
    return String(s).slice(0, 10);
  },
};

// ---- App state ----
let state = null;
let currentRoute = "dashboard";
let currentPeriod = "month";

// ---- Boot ----
document.addEventListener("DOMContentLoaded", () => {
  state = DB.load();
  bindShell();
  navigate(getRouteFromHash() || "dashboard");
});

function bindShell() {
  // Sidebar nav
  $$(".nav-item").forEach(el => {
    el.addEventListener("click", () => {
      const route = el.dataset.route;
      location.hash = "#/" + route;
    });
  });
  window.addEventListener("hashchange", () => navigate(getRouteFromHash()));

  // Mobile menu
  $("#menuToggle").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
  });
  $("#sidebar").addEventListener("click", (e) => {
    if (e.target.closest(".nav-item")) {
      $("#sidebar").classList.remove("open");
    }
  });

  // Period filter
  $("#periodFilter").addEventListener("change", (e) => {
    currentPeriod = e.target.value;
    if (currentRoute === "dashboard") renderDashboard();
    if (currentRoute === "reports") renderReports();
  });

  // Export rapport
  $("#exportReport").addEventListener("click", exportReport);

  // Modal close
  $("#modalClose").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
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
    dashboard: ["Bonjour, " + (state.settings.manager || "Gérant") + " 👋", "Aperçu de l’activité"],
    entries: ["Entrées d’argent", "Suivi des recettes"],
    expenses: ["Sorties / Dépenses", "Suivi des charges"],
    orders: ["Commandes", "Suivi du restaurant"],
    deliveries: ["Livraisons", "Suivi des livraisons"],
    apartments: ["Appartements", "État des résidences"],
    invoices: ["Factures", "Suivi des règlements"],
    reports: ["Rapports", "Synthèse de l’activité"],
    settings: ["Paramètres", "Configuration de l’application"],
    backup: ["Sauvegarde", "Export, import, réinitialisation"],
  };
  const [t, s] = titles[route];
  $("#helloTitle").textContent = t;
  $("#helloSubtitle").textContent = s;

  // Render
  switch (route) {
    case "dashboard": return renderDashboard();
    case "entries": return renderEntries();
    case "expenses": return renderExpenses();
    case "orders": return renderOrders();
    case "deliveries": return renderDeliveries();
    case "apartments": return renderApartments();
    case "invoices": return renderInvoices();
    case "reports": return renderReports();
    case "settings": return renderSettings();
    case "backup": return renderBackup();
  }
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

  // Recent slices
  const lastOrders = state.orders.slice(0, 5);
  const lastEntries = state.entries.slice(0, 5);
  const lastExpenses = state.expenses.slice(0, 5);
  const lastInvoices = state.invoices.slice(0, 5);

  // Bar chart data: 7 derniers jours
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
  for (const e of periodEntries) {
    caByCat[e.category] = (caByCat[e.category] || 0) + e.amount;
  }
  const totalCA = Object.values(caByCat).reduce((a, b) => a + b, 0) || 1;
  const catRows = Object.entries(caByCat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({ cat, val, pct: Math.round((val / totalCA) * 100) }));

  $("#view").innerHTML = `
    <!-- STATS -->
    <div class="stats-grid">
      ${statCard("CA du jour", fmt.money(caJour))}
      ${statCard("Entrées du mois", fmt.money(entreesMois))}
      ${statCard("Sorties du mois", fmt.money(sortiesMois))}
      ${statCard("Bénéfice estimé", fmt.money(benefice))}
      ${statCard("Commandes aujourd’hui", cmdJour, "")}
      ${statCard("Livraisons en cours", livEnCours, "")}
      ${statCard("Appart. disponibles", `${aptDispo} / ${totalApts}`)}
      ${statCard("Appart. occupés", `${aptOccup} / ${totalApts}`)}
      ${statCard("Factures impayées", facImpayees, "")}
      ${statCard("Factures payées", facPayees, "")}
    </div>

    <!-- CHARTS -->
    <div class="charts-grid">
      <div class="section">
        <div class="section-head">
          <span class="gold-bar"></span>
          <h3>Entrées vs Sorties — 7 derniers jours</h3>
        </div>
        <div class="chart-bars">
          ${days.map(d => `
            <div class="bar-group">
              <div class="bar-stack" title="Entrées ${fmt.money(d.in)} / Sorties ${fmt.money(d.out)}">
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
        <div class="section-head">
          <span class="gold-bar"></span>
          <h3>Chiffre d’affaires par activité</h3>
        </div>
        <div class="donut-list">
          ${catRows.length ? catRows.map(r => `
            <div class="donut-row">
              <div class="top"><span>${escapeHtml(r.cat)}</span><span>${fmt.money(r.val)} · ${r.pct}%</span></div>
              <div class="donut-track"><div class="donut-fill" style="width:${r.pct}%"></div></div>
            </div>
          `).join("") : `<p style="color:var(--muted);font-size:13px;">Aucune entrée pour la période.</p>`}
        </div>
      </div>
    </div>

    <!-- APARTMENTS -->
    <div class="section">
      <div class="section-head">
        <span class="gold-bar"></span>
        <h3>État des appartements</h3>
        <div class="actions">
          <a class="btn btn-ghost btn-sm" href="#/apartments">Voir tout</a>
        </div>
      </div>
      <div class="apt-grid">
        ${state.apartments.map(a => apartmentTile(a)).join("")}
      </div>
    </div>

    <!-- TABLES TRIPTYQUE -->
    <div class="cols-3">
      ${recentTable("Dernières commandes", "#/orders", `
        <thead><tr><th>N°</th><th>Statut</th><th class="num">Montant</th></tr></thead>
        <tbody>
          ${lastOrders.map(o => `
            <tr>
              <td><strong>${o.id}</strong><br><span style="color:var(--muted);font-size:11px;">${fmt.date(o.date)}</span></td>
              <td>${orderStatusPill(o.status)}</td>
              <td class="num">${fmt.money(o.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      `)}

      ${recentTable("Dernières entrées", "#/entries", `
        <thead><tr><th>Libellé</th><th class="num">Montant</th></tr></thead>
        <tbody>
          ${lastEntries.map(e => `
            <tr>
              <td>${escapeHtml(e.label)}<br><span style="color:var(--muted);font-size:11px;">${escapeHtml(e.category)} · ${fmt.date(e.date)}</span></td>
              <td class="num">${fmt.money(e.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      `)}

      ${recentTable("Dernières sorties", "#/expenses", `
        <thead><tr><th>Libellé</th><th class="num">Montant</th></tr></thead>
        <tbody>
          ${lastExpenses.map(e => `
            <tr>
              <td>${escapeHtml(e.label)}<br><span style="color:var(--muted);font-size:11px;">${escapeHtml(e.category)} · ${fmt.date(e.date)}</span></td>
              <td class="num">${fmt.money(e.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      `)}
    </div>

    <!-- INVOICES -->
    <div class="section">
      <div class="section-head">
        <span class="gold-bar"></span>
        <h3>Dernières factures</h3>
        <div class="actions">
          <a class="btn btn-ghost btn-sm" href="#/invoices">Voir tout</a>
        </div>
      </div>
      <div class="table-wrap">
        <table class="tbl">
          <thead>
            <tr><th>N°</th><th>Date</th><th>Client</th><th class="num">Montant</th><th>Statut</th></tr>
          </thead>
          <tbody>
            ${lastInvoices.map(f => `
              <tr>
                <td><strong>${f.id}</strong></td>
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
}

function statCard(label, value, suffix = "") {
  return `
    <div class="stat-card">
      <p class="stat-label">${escapeHtml(label)}</p>
      <div class="stat-value">${value}${suffix ? `<span class="stat-suffix">${suffix}</span>` : ""}</div>
    </div>
  `;
}

function recentTable(title, href, inner) {
  return `
    <div class="section">
      <div class="section-head">
        <span class="gold-bar"></span>
        <h3>${escapeHtml(title)}</h3>
        <div class="actions"><a class="btn btn-ghost btn-sm" href="${href}">Voir tout</a></div>
      </div>
      <div class="table-wrap"><table class="tbl">${inner}</table></div>
    </div>
  `;
}

function apartmentTile(a) {
  const cls = (a.status || "").toLowerCase();
  return `
    <div class="apt" data-route="apartments">
      <span class="apt-status ${cls}">${escapeHtml(a.status)}</span>
      <span class="apt-name">${escapeHtml(a.id)}</span>
      <span class="apt-meta">${escapeHtml(a.name.replace(a.id + " — ", ""))}</span>
      <span class="apt-meta">${fmt.money(a.price)} / nuit</span>
    </div>
  `;
}

/* =====================================================
   ENTRIES module
   ===================================================== */
function renderEntries() {
  const view = $("#view");
  const total = sum(state.entries.filter(e => e.paid), "amount");
  view.innerHTML = `
    ${moduleHeader("Entrées d’argent", "Ajouter une entrée", "addEntry", `Total encaissé : <strong>${fmt.money(total)}</strong>`)}
    <div class="section">
      ${searchAndFilter("entries", ["Toutes", "Restaurant", "Appartements", "Livraisons", "Autre"])}
      <div class="table-wrap" id="entriesTable"></div>
    </div>
  `;
  bindAdd("addEntry", () => entryForm());
  bindFilter("entries", () => drawEntriesTable());
  drawEntriesTable();
}

function drawEntriesTable() {
  const { q, cat } = readFilters("entries");
  const rows = state.entries.filter(e => {
    const matchQ = !q || (e.label + e.category).toLowerCase().includes(q);
    const matchCat = cat === "Toutes" || e.category === cat;
    return matchQ && matchCat;
  });
  $("#entriesTable").innerHTML = `
    <table class="tbl">
      <thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th class="num">Montant</th><th>Statut</th><th></th></tr></thead>
      <tbody>
        ${rows.map(e => `
          <tr>
            <td>${fmt.date(e.date)}</td>
            <td>${escapeHtml(e.label)}</td>
            <td><span class="pill pill-cream">${escapeHtml(e.category)}</span></td>
            <td class="num">${fmt.money(e.amount)}</td>
            <td>${e.paid ? `<span class="pill pill-green">Encaissée</span>` : `<span class="pill pill-grey">En attente</span>`}</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm" data-edit-entry="${e.id}">Éditer</button>
              <button class="btn btn-danger btn-sm" data-del-entry="${e.id}">Suppr.</button>
            </td>
          </tr>
        `).join("") || emptyRow(6)}
      </tbody>
    </table>
  `;
  $$("[data-edit-entry]").forEach(b => b.addEventListener("click", () => {
    const rec = state.entries.find(x => x.id === b.dataset.editEntry);
    entryForm(rec);
  }));
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
  openModal(isEdit ? "Éditer une entrée" : "Nouvelle entrée", `
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
      <div class="field"><label>Libellé</label><input name="label" value="${escapeAttr(rec?.label || "")}" required></div>
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
  `, [
    { label: "Annuler", class: "btn-ghost", action: closeModal },
    { label: isEdit ? "Enregistrer" : "Ajouter", class: "btn-gold", action: () => {
      const data = readForm("entryForm");
      data.amount = Number(data.amount);
      data.paid = data.paid === "true";
      if (isEdit) DB.update("entries", rec.id, data);
      else DB.add("entries", data);
      closeModal();
      drawEntriesTable();
      toast(isEdit ? "Entrée mise à jour" : "Entrée ajoutée");
    }}
  ]);
}

/* =====================================================
   EXPENSES module
   ===================================================== */
function renderExpenses() {
  const total = sum(state.expenses, "amount");
  $("#view").innerHTML = `
    ${moduleHeader("Sorties / Dépenses", "Ajouter une sortie", "addExpense", `Total dépensé : <strong>${fmt.money(total)}</strong>`)}
    <div class="section">
      ${searchAndFilter("expenses", ["Toutes", "Approvisionnement", "Salaires", "Charges", "Logistique", "Entretien", "Autre"])}
      <div class="table-wrap" id="expensesTable"></div>
    </div>
  `;
  bindAdd("addExpense", () => expenseForm());
  bindFilter("expenses", () => drawExpensesTable());
  drawExpensesTable();
}

function drawExpensesTable() {
  const { q, cat } = readFilters("expenses");
  const rows = state.expenses.filter(e => {
    const matchQ = !q || (e.label + e.category).toLowerCase().includes(q);
    const matchCat = cat === "Toutes" || e.category === cat;
    return matchQ && matchCat;
  });
  $("#expensesTable").innerHTML = `
    <table class="tbl">
      <thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th class="num">Montant</th><th></th></tr></thead>
      <tbody>
        ${rows.map(e => `
          <tr>
            <td>${fmt.date(e.date)}</td>
            <td>${escapeHtml(e.label)}</td>
            <td><span class="pill pill-cream">${escapeHtml(e.category)}</span></td>
            <td class="num">${fmt.money(e.amount)}</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm" data-edit-exp="${e.id}">Éditer</button>
              <button class="btn btn-danger btn-sm" data-del-exp="${e.id}">Suppr.</button>
            </td>
          </tr>
        `).join("") || emptyRow(5)}
      </tbody>
    </table>
  `;
  $$("[data-edit-exp]").forEach(b => b.addEventListener("click", () => {
    const rec = state.expenses.find(x => x.id === b.dataset.editExp);
    expenseForm(rec);
  }));
  $$("[data-del-exp]").forEach(b => b.addEventListener("click", () => {
    if (confirm("Supprimer cette sortie ?")) {
      DB.remove("expenses", b.dataset.delExp);
      drawExpensesTable();
      toast("Sortie supprimée");
    }
  }));
}

function expenseForm(rec) {
  const isEdit = !!rec;
  openModal(isEdit ? "Éditer une sortie" : "Nouvelle sortie", `
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
      <div class="field"><label>Libellé</label><input name="label" value="${escapeAttr(rec?.label || "")}" required></div>
      <div class="field"><label>Montant (Ar)</label><input type="number" min="0" step="1000" name="amount" value="${rec?.amount ?? ""}" required></div>
    </form>
  `, [
    { label: "Annuler", class: "btn-ghost", action: closeModal },
    { label: isEdit ? "Enregistrer" : "Ajouter", class: "btn-gold", action: () => {
      const data = readForm("expenseForm");
      data.amount = Number(data.amount);
      if (isEdit) DB.update("expenses", rec.id, data);
      else DB.add("expenses", data);
      closeModal();
      drawExpensesTable();
      toast(isEdit ? "Sortie mise à jour" : "Sortie ajoutée");
    }}
  ]);
}

/* =====================================================
   ORDERS module
   ===================================================== */
function renderOrders() {
  $("#view").innerHTML = `
    ${moduleHeader("Commandes", "Nouvelle commande", "addOrder", `${state.orders.length} commandes enregistrées`)}
    <div class="section">
      ${searchAndFilter("orders", ["Toutes", "En attente", "En préparation", "Prête", "Livrée", "Annulée"])}
      <div class="table-wrap" id="ordersTable"></div>
    </div>
  `;
  bindAdd("addOrder", () => orderForm());
  bindFilter("orders", () => drawOrdersTable());
  drawOrdersTable();
}

function drawOrdersTable() {
  const { q, cat } = readFilters("orders");
  const rows = state.orders.filter(o => {
    const matchQ = !q || (o.id + " " + (o.client || "") + " " + (o.items || "")).toLowerCase().includes(q);
    const matchCat = cat === "Toutes" || o.status === cat;
    return matchQ && matchCat;
  });
  $("#ordersTable").innerHTML = `
    <table class="tbl">
      <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Articles</th><th>Statut</th><th class="num">Montant</th><th></th></tr></thead>
      <tbody>
        ${rows.map(o => `
          <tr>
            <td><strong>${o.id}</strong></td>
            <td>${fmt.date(o.date)}</td>
            <td>${escapeHtml(o.client || "—")}</td>
            <td>${escapeHtml(o.items || "—")}</td>
            <td>${orderStatusPill(o.status)}</td>
            <td class="num">${fmt.money(o.amount)}</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm" data-edit-order="${o.id}">Éditer</button>
              <button class="btn btn-danger btn-sm" data-del-order="${o.id}">Suppr.</button>
            </td>
          </tr>
        `).join("") || emptyRow(7)}
      </tbody>
    </table>
  `;
  $$("[data-edit-order]").forEach(b => b.addEventListener("click", () => {
    const rec = state.orders.find(x => x.id === b.dataset.editOrder);
    orderForm(rec);
  }));
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
  openModal(isEdit ? "Éditer la commande" : "Nouvelle commande", `
    <form class="form" id="orderForm">
      <div class="grid-2">
        <div class="field"><label>N°</label><input name="id" value="${escapeAttr(rec?.id || nextOrderId())}" required></div>
        <div class="field"><label>Date</label><input type="date" name="date" value="${fmt.dateInput(rec?.date) || today()}" required></div>
      </div>
      <div class="field"><label>Client</label><input name="client" value="${escapeAttr(rec?.client || "")}"></div>
      <div class="field"><label>Articles</label><input name="items" value="${escapeAttr(rec?.items || "")}"></div>
      <div class="grid-2">
        <div class="field"><label>Statut</label>
          <select name="status">
            ${["En attente", "En préparation", "Prête", "Livrée", "Annulée"]
              .map(s => `<option ${rec?.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Montant (Ar)</label><input type="number" min="0" step="1000" name="amount" value="${rec?.amount ?? ""}" required></div>
      </div>
    </form>
  `, [
    { label: "Annuler", class: "btn-ghost", action: closeModal },
    { label: isEdit ? "Enregistrer" : "Ajouter", class: "btn-gold", action: () => {
      const data = readForm("orderForm");
      data.amount = Number(data.amount);
      if (isEdit) DB.update("orders", rec.id, data);
      else DB.add("orders", data);
      closeModal();
      drawOrdersTable();
      toast(isEdit ? "Commande mise à jour" : "Commande ajoutée");
    }}
  ]);
}

function nextOrderId() {
  const nums = state.orders
    .map(o => parseInt(String(o.id).replace(/\D/g, ""), 10))
    .filter(Number.isFinite);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "CMD-" + String(next).padStart(5, "0");
}

function orderStatusPill(s) {
  const map = {
    "En attente": "pill-grey",
    "En préparation": "pill-gold",
    "Prête": "pill-green",
    "Livrée": "pill-green",
    "Annulée": "pill-red",
  };
  return `<span class="pill ${map[s] || "pill-cream"}">${escapeHtml(s)}</span>`;
}

/* =====================================================
   DELIVERIES module
   ===================================================== */
function renderDeliveries() {
  $("#view").innerHTML = `
    ${moduleHeader("Livraisons", "Nouvelle livraison", "addDelivery", `${state.deliveries.length} livraisons enregistrées`)}
    <div class="section">
      ${searchAndFilter("deliveries", ["Toutes", "En cours", "Livrée", "Annulée"])}
      <div class="table-wrap" id="deliveriesTable"></div>
    </div>
  `;
  bindAdd("addDelivery", () => deliveryForm());
  bindFilter("deliveries", () => drawDeliveriesTable());
  drawDeliveriesTable();
}

function drawDeliveriesTable() {
  const { q, cat } = readFilters("deliveries");
  const rows = state.deliveries.filter(d => {
    const matchQ = !q || (d.id + " " + (d.client || "") + " " + (d.address || "")).toLowerCase().includes(q);
    const matchCat = cat === "Toutes" || d.status === cat;
    return matchQ && matchCat;
  });
  $("#deliveriesTable").innerHTML = `
    <table class="tbl">
      <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Adresse</th><th>Statut</th><th class="num">Montant</th><th></th></tr></thead>
      <tbody>
        ${rows.map(d => `
          <tr>
            <td><strong>${d.id}</strong></td>
            <td>${fmt.date(d.date)}</td>
            <td>${escapeHtml(d.client || "—")}</td>
            <td>${escapeHtml(d.address || "—")}</td>
            <td>${orderStatusPill(d.status)}</td>
            <td class="num">${fmt.money(d.amount)}</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm" data-edit-del="${d.id}">Éditer</button>
              <button class="btn btn-danger btn-sm" data-del-del="${d.id}">Suppr.</button>
            </td>
          </tr>
        `).join("") || emptyRow(7)}
      </tbody>
    </table>
  `;
  $$("[data-edit-del]").forEach(b => b.addEventListener("click", () => {
    const rec = state.deliveries.find(x => x.id === b.dataset.editDel);
    deliveryForm(rec);
  }));
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
  openModal(isEdit ? "Éditer la livraison" : "Nouvelle livraison", `
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
  `, [
    { label: "Annuler", class: "btn-ghost", action: closeModal },
    { label: isEdit ? "Enregistrer" : "Ajouter", class: "btn-gold", action: () => {
      const data = readForm("deliveryForm");
      data.amount = Number(data.amount);
      if (isEdit) DB.update("deliveries", rec.id, data);
      else DB.add("deliveries", data);
      closeModal();
      drawDeliveriesTable();
      toast(isEdit ? "Livraison mise à jour" : "Livraison ajoutée");
    }}
  ]);
}

function nextDeliveryId() {
  const nums = state.deliveries
    .map(o => parseInt(String(o.id).replace(/\D/g, ""), 10))
    .filter(Number.isFinite);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return "LIV-" + String(next).padStart(5, "0");
}

/* =====================================================
   APARTMENTS module
   ===================================================== */
function renderApartments() {
  const total = state.apartments.length;
  const occ = state.apartments.filter(a => a.status === "Occupé").length;
  const occRate = total ? Math.round((occ / total) * 100) : 0;

  $("#view").innerHTML = `
    ${moduleHeader("Appartements", "Ajouter un appartement", "addApt",
      `Taux d’occupation : <strong>${occRate}%</strong> (${occ}/${total})`)}
    <div class="section">
      ${searchAndFilter("apartments", ["Tous", "Disponible", "Occupé", "Réservé", "Maintenance"])}
      <div class="apt-grid" id="aptGrid" style="margin-top:14px;"></div>
    </div>
  `;
  bindAdd("addApt", () => aptForm());
  bindFilter("apartments", () => drawApartments());
  drawApartments();
}

function drawApartments() {
  const { q, cat } = readFilters("apartments");
  const rows = state.apartments.filter(a => {
    const matchQ = !q || (a.id + " " + a.name + " " + (a.note || "")).toLowerCase().includes(q);
    const matchCat = cat === "Tous" || a.status === cat;
    return matchQ && matchCat;
  });
  $("#aptGrid").innerHTML = rows.map(a => {
    const cls = (a.status || "").toLowerCase();
    return `
      <div class="apt">
        <span class="apt-status ${cls}">${escapeHtml(a.status)}</span>
        <span class="apt-name">${escapeHtml(a.id)}</span>
        <span class="apt-meta">${escapeHtml(a.name.replace(a.id + " — ", ""))}</span>
        <span class="apt-meta">${fmt.money(a.price)} / nuit</span>
        ${a.note ? `<span class="apt-meta" style="font-style:italic;">${escapeHtml(a.note)}</span>` : ""}
        <div class="row-actions" style="margin-top:8px;">
          <button class="btn btn-ghost btn-sm" data-edit-apt="${a.id}">Éditer</button>
          <button class="btn btn-danger btn-sm" data-del-apt="${a.id}">Suppr.</button>
        </div>
      </div>
    `;
  }).join("") || `<p style="color:var(--muted);">Aucun appartement.</p>`;

  $$("[data-edit-apt]").forEach(b => b.addEventListener("click", () => {
    const rec = state.apartments.find(x => x.id === b.dataset.editApt);
    aptForm(rec);
  }));
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
  openModal(isEdit ? "Éditer l’appartement" : "Nouvel appartement", `
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
  `, [
    { label: "Annuler", class: "btn-ghost", action: closeModal },
    { label: isEdit ? "Enregistrer" : "Ajouter", class: "btn-gold", action: () => {
      const data = readForm("aptForm");
      data.price = Number(data.price);
      if (isEdit) DB.update("apartments", rec.id, data);
      else DB.add("apartments", data);
      closeModal();
      drawApartments();
      toast(isEdit ? "Appartement mis à jour" : "Appartement ajouté");
    }}
  ]);
}

/* =====================================================
   INVOICES module
   ===================================================== */
function renderInvoices() {
  const totalDue = state.invoices.reduce((acc, f) => acc + (f.amount - (f.paid || 0)), 0);
  const totalAll = sum(state.invoices, "amount");
  $("#view").innerHTML = `
    ${moduleHeader("Factures", "Nouvelle facture", "addInvoice",
      `Total facturé : <strong>${fmt.money(totalAll)}</strong> · Reste à encaisser : <strong>${fmt.money(totalDue)}</strong>`)}
    <div class="section">
      ${searchAndFilter("invoices", ["Toutes", "Payée", "Partielle", "Impayée"])}
      <div class="table-wrap" id="invoicesTable"></div>
    </div>
  `;
  bindAdd("addInvoice", () => invoiceForm());
  bindFilter("invoices", () => drawInvoicesTable());
  drawInvoicesTable();
}

function drawInvoicesTable() {
  const { q, cat } = readFilters("invoices");
  const rows = state.invoices.filter(f => {
    const matchQ = !q || (f.id + " " + (f.client || "") + " " + (f.note || "")).toLowerCase().includes(q);
    const matchCat = cat === "Toutes" || f.status === cat;
    return matchQ && matchCat;
  });
  $("#invoicesTable").innerHTML = `
    <table class="tbl">
      <thead><tr><th>N°</th><th>Date</th><th>Client</th><th class="num">Montant</th><th class="num">Payé</th><th class="num">Reste</th><th>Statut</th><th></th></tr></thead>
      <tbody>
        ${rows.map(f => {
          const due = f.amount - (f.paid || 0);
          return `
            <tr>
              <td><strong>${f.id}</strong></td>
              <td>${fmt.date(f.date)}</td>
              <td>${escapeHtml(f.client || "—")}</td>
              <td class="num">${fmt.money(f.amount)}</td>
              <td class="num">${fmt.money(f.paid || 0)}</td>
              <td class="num">${fmt.money(due)}</td>
              <td>${invoiceStatusPill(f.status)}</td>
              <td class="row-actions">
                <button class="btn btn-ghost btn-sm" data-view-inv="${f.id}">Voir</button>
                ${f.status !== "Payée" ? `<button class="btn btn-paradis btn-sm" data-pay-inv="${f.id}">Marquer payée</button>` : ""}
                <button class="btn btn-ghost btn-sm" data-edit-inv="${f.id}">Éditer</button>
                <button class="btn btn-danger btn-sm" data-del-inv="${f.id}">Suppr.</button>
              </td>
            </tr>
          `;
        }).join("") || emptyRow(8)}
      </tbody>
    </table>
  `;
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
  openModal(isEdit ? "Éditer la facture" : "Nouvelle facture", `
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
  `, [
    { label: "Annuler", class: "btn-ghost", action: closeModal },
    { label: isEdit ? "Enregistrer" : "Créer", class: "btn-gold", action: () => {
      const data = readForm("invoiceForm");
      data.amount = Number(data.amount);
      data.paid = Number(data.paid);
      data.status = data.paid >= data.amount ? "Payée" : (data.paid > 0 ? "Partielle" : "Impayée");
      if (isEdit) DB.update("invoices", rec.id, data);
      else DB.add("invoices", data);
      closeModal();
      drawInvoicesTable();
      toast(isEdit ? "Facture mise à jour" : "Facture créée");
    }}
  ]);
}

function viewInvoice(f) {
  if (!f) return;
  const due = f.amount - (f.paid || 0);
  openModal(`Facture ${f.id}`, `
    <div style="font-family:var(--font-display); font-size:18px; color:var(--paradis-dark); margin-bottom:6px;">
      ${escapeHtml(state.settings.establishment || "Le Paradisier")}
    </div>
    <p style="color:var(--muted); margin:0 0 16px;">${escapeHtml(state.settings.tagline || "")}</p>
    <table class="tbl" style="margin-bottom:14px;">
      <tbody>
        <tr><th>N°</th><td>${f.id}</td></tr>
        <tr><th>Date</th><td>${fmt.date(f.date)}</td></tr>
        <tr><th>Client</th><td>${escapeHtml(f.client || "—")}</td></tr>
        <tr><th>Description</th><td>${escapeHtml(f.note || "—")}</td></tr>
        <tr><th>Montant</th><td class="num">${fmt.money(f.amount)}</td></tr>
        <tr><th>Payé</th><td class="num">${fmt.money(f.paid || 0)}</td></tr>
        <tr><th>Reste à payer</th><td class="num">${fmt.money(due)}</td></tr>
        <tr><th>Statut</th><td>${invoiceStatusPill(f.status)}</td></tr>
      </tbody>
    </table>
  `, [
    { label: "Imprimer", class: "btn-ghost", action: () => window.print() },
    { label: "Fermer", class: "btn-paradis", action: closeModal },
  ]);
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
    <div class="stats-grid">
      ${statCard("Chiffre d’affaires", fmt.money(ca))}
      ${statCard("Sorties", fmt.money(out))}
      ${statCard("Bénéfice", fmt.money(profit))}
      ${statCard("Taux d’occupation", occRate + " %")}
      ${statCard("Reste à encaisser", fmt.money(due))}
    </div>

    <div class="cols-2">
      <div class="section">
        <div class="section-head"><span class="gold-bar"></span><h3>Entrées par activité</h3></div>
        ${barListHTML(byCatIn)}
      </div>
      <div class="section">
        <div class="section-head"><span class="gold-bar"></span><h3>Sorties par catégorie</h3></div>
        ${barListHTML(byCatOut)}
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <span class="gold-bar"></span>
        <h3>Synthèse de la période</h3>
        <div class="actions"><button class="btn btn-gold" id="reportExportBtn">Exporter le rapport</button></div>
      </div>
      <table class="tbl">
        <tbody>
          <tr><th>Période</th><td>${periodLabel(currentPeriod)}</td></tr>
          <tr><th>Entrées encaissées</th><td class="num">${fmt.money(ca)}</td></tr>
          <tr><th>Sorties</th><td class="num">${fmt.money(out)}</td></tr>
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
  if (!entries.length) return `<p style="color:var(--muted);">Aucune donnée pour cette période.</p>`;
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
    <div class="section">
      <div class="section-head"><span class="gold-bar"></span><h3>Établissement</h3></div>
      <form class="form" id="settingsForm" style="max-width:560px;">
        <div class="grid-2">
          <div class="field"><label>Nom</label><input name="establishment" value="${escapeAttr(s.establishment)}"></div>
          <div class="field"><label>Devise</label><input name="currency" value="${escapeAttr(s.currency)}"></div>
        </div>
        <div class="field"><label>Sous-titre</label><input name="tagline" value="${escapeAttr(s.tagline)}"></div>
        <div class="grid-2">
          <div class="field"><label>Gérant</label><input name="manager" value="${escapeAttr(s.manager)}"></div>
          <div class="field"><label>Locale</label><input name="locale" value="${escapeAttr(s.locale)}"></div>
        </div>
        <div style="margin-top:6px;">
          <button type="button" class="btn btn-gold" id="saveSettings">Enregistrer</button>
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
    <div class="cols-2">
      <div class="section">
        <div class="section-head"><span class="gold-bar"></span><h3>Exporter les données</h3></div>
        <p style="color:var(--muted);">Téléchargez l’ensemble de vos données au format JSON pour les conserver hors-ligne.</p>
        <button class="btn btn-gold" id="btnExport">Télécharger le fichier JSON</button>
      </div>
      <div class="section">
        <div class="section-head"><span class="gold-bar"></span><h3>Importer un fichier</h3></div>
        <p style="color:var(--muted);">Restaurez l’application à partir d’un fichier JSON exporté précédemment.</p>
        <input type="file" id="fileImport" accept="application/json" style="margin-bottom:10px;">
        <div><button class="btn btn-paradis" id="btnImport">Importer</button></div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><span class="gold-bar"></span><h3>Réinitialiser</h3></div>
      <p style="color:var(--muted);">Cette action remplace toutes les données par les données de démonstration. Elle ne peut pas être annulée.</p>
      <button class="btn btn-danger" id="btnReset">Réinitialiser les données</button>
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
   Reusable UI helpers
   ===================================================== */
function moduleHeader(title, addLabel, addId, subtitle = "") {
  return `
    <div class="section">
      <div class="section-head">
        <span class="gold-bar"></span>
        <h3>${escapeHtml(title)}</h3>
        ${subtitle ? `<span style="color:var(--muted); font-size:13px; margin-left:14px;">${subtitle}</span>` : ""}
        <div class="actions">
          <button class="btn btn-gold" id="${addId}">+ ${escapeHtml(addLabel)}</button>
        </div>
      </div>
    </div>
  `;
}

function searchAndFilter(scope, categories) {
  return `
    <div style="display:flex; gap:10px; align-items:center; margin-bottom:14px; flex-wrap:wrap;">
      <div class="search-bar">
        <span style="color:var(--muted);">⌕</span>
        <input data-search="${scope}" placeholder="Rechercher…" />
      </div>
      <select data-cat="${scope}" class="period" style="padding:8px 14px;">
        ${categories.map(c => `<option>${escapeHtml(c)}</option>`).join("")}
      </select>
    </div>
  `;
}

function readFilters(scope) {
  const q = ($(`[data-search="${scope}"]`)?.value || "").trim().toLowerCase();
  const cat = $(`[data-cat="${scope}"]`)?.value || "Toutes";
  return { q, cat };
}

function bindFilter(scope, cb) {
  const s = $(`[data-search="${scope}"]`);
  const c = $(`[data-cat="${scope}"]`);
  if (s) s.addEventListener("input", cb);
  if (c) c.addEventListener("change", cb);
}

function bindAdd(id, cb) {
  const b = document.getElementById(id);
  if (b) b.addEventListener("click", cb);
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}" style="text-align:center; color:var(--muted); padding:24px;">Aucun élément à afficher.</td></tr>`;
}

/* ----- Modal ----- */
function openModal(title, bodyHTML, footerButtons = []) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHTML;
  $("#modalFoot").innerHTML = "";
  for (const btn of footerButtons) {
    const b = document.createElement("button");
    b.className = `btn ${btn.class || "btn-ghost"}`;
    b.textContent = btn.label;
    b.addEventListener("click", btn.action);
    $("#modalFoot").appendChild(b);
  }
  $("#modal").hidden = false;
}
function closeModal() { $("#modal").hidden = true; }

/* ----- Toast ----- */
let toastTimer;
function toast(msg, isError = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("error", isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2400);
}

/* ----- Form helpers ----- */
function readForm(formId) {
  const form = document.getElementById(formId);
  const data = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    data[el.name] = el.value;
  }
  return data;
}

/* ----- Misc ----- */
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

/* ----- Export ----- */
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
