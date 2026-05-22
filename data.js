/* ===========================================================
   Le Paradisier Manager — Persistence layer (data.js)
   Stockage local via localStorage, données de démonstration au
   premier lancement.
   =========================================================== */

const STORAGE_KEY = "paradisier.manager.v1";

const DEMO_DATA = {
  meta: {
    createdAt: new Date().toISOString(),
    invoiceCounter: 7,
  },
  entries: [
    { id: id(), date: today(0), label: "Vente restaurant", category: "Restaurant", amount: 380000, paid: true },
    { id: id(), date: today(0), label: "Séjour Appart A2", category: "Appartements", amount: 200000, paid: true },
    { id: id(), date: today(-1), label: "Livraison #LIV-21", category: "Livraisons", amount: 45000, paid: true },
    { id: id(), date: today(-1), label: "Vente restaurant", category: "Restaurant", amount: 260000, paid: true },
    { id: id(), date: today(-2), label: "Séjour Appart B1", category: "Appartements", amount: 180000, paid: true },
    { id: id(), date: today(-3), label: "Vente restaurant", category: "Restaurant", amount: 420000, paid: true },
    { id: id(), date: today(-4), label: "Séjour Appart A5", category: "Appartements", amount: 350000, paid: true },
    { id: id(), date: today(-5), label: "Vente restaurant", category: "Restaurant", amount: 290000, paid: true },
    { id: id(), date: today(-7), label: "Livraison #LIV-19", category: "Livraisons", amount: 60000, paid: true },
    { id: id(), date: today(-9), label: "Séjour Appart B3", category: "Appartements", amount: 240000, paid: true },
    { id: id(), date: today(-12), label: "Vente restaurant", category: "Restaurant", amount: 310000, paid: true },
    { id: id(), date: today(-15), label: "Vente restaurant", category: "Restaurant", amount: 275000, paid: true },
    { id: id(), date: today(-18), label: "Séjour Appart A2", category: "Appartements", amount: 210000, paid: true },
    { id: id(), date: today(-22), label: "Livraison #LIV-15", category: "Livraisons", amount: 35000, paid: true },
    { id: id(), date: today(-25), label: "Vente restaurant", category: "Restaurant", amount: 365000, paid: true },
  ],
  expenses: [
    { id: id(), date: today(0), label: "Achat marchandises", category: "Approvisionnement", amount: 150000 },
    { id: id(), date: today(-1), label: "Salaire personnel", category: "Salaires", amount: 500000 },
    { id: id(), date: today(-2), label: "Électricité", category: "Charges", amount: 120000 },
    { id: id(), date: today(-3), label: "Transport", category: "Logistique", amount: 80000 },
    { id: id(), date: today(-4), label: "Maintenance", category: "Entretien", amount: 60000 },
    { id: id(), date: today(-7), label: "Achat boissons", category: "Approvisionnement", amount: 220000 },
    { id: id(), date: today(-10), label: "Eau", category: "Charges", amount: 75000 },
    { id: id(), date: today(-14), label: "Internet & téléphonie", category: "Charges", amount: 90000 },
    { id: id(), date: today(-18), label: "Produits ménagers", category: "Entretien", amount: 55000 },
    { id: id(), date: today(-22), label: "Achat marchandises", category: "Approvisionnement", amount: 180000 },
  ],
  orders: [
    { id: "CMD-00045", date: today(0), client: "Table 3", items: "Menu du jour x2", status: "En préparation", amount: 120000 },
    { id: "CMD-00044", date: today(0), client: "Table 7", items: "Plat du chef", status: "Prête", amount: 85000 },
    { id: "CMD-00043", date: today(-1), client: "M. Rakoto", items: "Livraison maison", status: "Livrée", amount: 150000 },
    { id: "CMD-00042", date: today(-1), client: "Table 1", items: "Carte boissons", status: "En attente", amount: 60000 },
    { id: "CMD-00041", date: today(-2), client: "Mme Rasoa", items: "Réservation annulée", status: "Annulée", amount: 40000 },
    { id: "CMD-00040", date: today(-2), client: "Table 5", items: "Menu dégustation", status: "Livrée", amount: 220000 },
    { id: "CMD-00039", date: today(-3), client: "M. Andry", items: "Livraison à domicile", status: "Livrée", amount: 95000 },
  ],
  deliveries: [
    { id: "LIV-00021", date: today(0), client: "M. Rakoto", address: "Antaninarenina", status: "En cours", amount: 150000 },
    { id: "LIV-00020", date: today(0), client: "Mme Soa", address: "Ankorondrano", status: "En cours", amount: 75000 },
    { id: "LIV-00019", date: today(-1), client: "M. Hery", address: "Ivandry", status: "Livrée", amount: 60000 },
    { id: "LIV-00018", date: today(-1), client: "Mme Vola", address: "Analakely", status: "Livrée", amount: 90000 },
    { id: "LIV-00017", date: today(-2), client: "M. Tiana", address: "Andoharanofotsy", status: "Annulée", amount: 50000 },
  ],
  apartments: [
    { id: "A1", name: "A1 — Suite Vanille", status: "Disponible", price: 180000, note: "Rez-de-chaussée" },
    { id: "A2", name: "A2 — Suite Cannelle", status: "Occupé", price: 200000, note: "Client : M. Rakoto (jusqu’au 25)" },
    { id: "A3", name: "A3 — Suite Café", status: "Réservé", price: 220000, note: "Réservée pour 24/05" },
    { id: "A4", name: "A4 — Suite Lagune", status: "Disponible", price: 240000, note: "Étage 1" },
    { id: "A5", name: "A5 — Suite Or", status: "Occupé", price: 280000, note: "Client : Mme Vola" },
    { id: "A6", name: "A6 — Suite Palmier", status: "Maintenance", price: 220000, note: "Climatiseur en cours de réparation" },
    { id: "B1", name: "B1 — Studio Jardin", status: "Disponible", price: 150000, note: "Vue jardin" },
    { id: "B2", name: "B2 — Studio Mer", status: "Réservé", price: 170000, note: "Réservée pour 26/05" },
    { id: "B3", name: "B3 — Studio Coco", status: "Occupé", price: 160000, note: "Client : M. Hery" },
    { id: "B4", name: "B4 — Studio Ivoire", status: "Disponible", price: 160000, note: "" },
    { id: "B5", name: "B5 — Studio Bronze", status: "Disponible", price: 170000, note: "" },
    { id: "B6", name: "B6 — Studio Nacre", status: "Disponible", price: 180000, note: "" },
  ],
  invoices: [
    { id: "FAC-202605-0007", date: today(0), client: "M. Rakoto", amount: 450000, paid: 0, status: "Impayée", note: "Séjour A2 + restauration" },
    { id: "FAC-202605-0006", date: today(-1), client: "Mme Soa", amount: 250000, paid: 250000, status: "Payée", note: "Restauration" },
    { id: "FAC-202605-0005", date: today(-2), client: "M. Hery", amount: 380000, paid: 200000, status: "Partielle", note: "Séjour B3" },
    { id: "FAC-202605-0004", date: today(-3), client: "Mme Vola", amount: 120000, paid: 120000, status: "Payée", note: "Livraison" },
    { id: "FAC-202605-0003", date: today(-5), client: "M. Andry", amount: 200000, paid: 0, status: "Impayée", note: "Restauration groupe" },
    { id: "FAC-202605-0002", date: today(-7), client: "Mme Rasoa", amount: 320000, paid: 320000, status: "Payée", note: "Séjour A5" },
    { id: "FAC-202605-0001", date: today(-9), client: "M. Tiana", amount: 175000, paid: 175000, status: "Payée", note: "Livraison + restauration" },
  ],
  settings: {
    establishment: "Le Paradisier",
    tagline: "Hôtel · Restaurant · Résidences",
    manager: "Gérant",
    currency: "Ar",
    locale: "fr-FR",
  },
};

/* ---------- helpers ---------- */
function id() {
  return Math.random().toString(36).slice(2, 10);
}
function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/* ---------- DB ---------- */
const DB = {
  state: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.state = JSON.parse(JSON.stringify(DEMO_DATA));
        this.save();
        return this.state;
      }
      this.state = JSON.parse(raw);
      // forward-compat: ensure all keys exist
      for (const k of Object.keys(DEMO_DATA)) {
        if (!(k in this.state)) this.state[k] = DEMO_DATA[k];
      }
      return this.state;
    } catch (e) {
      console.warn("DB load error, restoring demo:", e);
      this.state = JSON.parse(JSON.stringify(DEMO_DATA));
      this.save();
      return this.state;
    }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  },

  reset() {
    this.state = JSON.parse(JSON.stringify(DEMO_DATA));
    this.save();
    return this.state;
  },

  exportJSON() {
    return JSON.stringify(this.state, null, 2);
  },

  importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("Format invalide");
    // light validation
    const requiredKeys = ["entries", "expenses", "orders", "deliveries", "apartments", "invoices", "settings"];
    for (const k of requiredKeys) {
      if (!(k in parsed)) throw new Error(`Champ manquant: ${k}`);
    }
    this.state = parsed;
    this.save();
    return this.state;
  },

  /* ----- generic CRUD ----- */
  add(collection, record) {
    if (!record.id) record.id = id();
    this.state[collection].unshift(record);
    this.save();
    return record;
  },
  update(collection, recordId, patch) {
    const i = this.state[collection].findIndex(r => r.id === recordId);
    if (i === -1) return null;
    this.state[collection][i] = { ...this.state[collection][i], ...patch };
    this.save();
    return this.state[collection][i];
  },
  remove(collection, recordId) {
    this.state[collection] = this.state[collection].filter(r => r.id !== recordId);
    this.save();
  },

  /* ----- invoice numbering ----- */
  nextInvoiceNumber() {
    const d = new Date();
    const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    this.state.meta = this.state.meta || { invoiceCounter: 0 };
    this.state.meta.invoiceCounter = (this.state.meta.invoiceCounter || 0) + 1;
    const seq = String(this.state.meta.invoiceCounter).padStart(4, "0");
    this.save();
    return `FAC-${yyyymm}-${seq}`;
  },
};
