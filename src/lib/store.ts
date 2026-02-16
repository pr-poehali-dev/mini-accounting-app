import { Company, Product, Invoice, Act, UPD, TabItem, TemplateSettings, DEFAULT_TEMPLATE, DocType } from "./types";

const STORAGE_KEYS = {
  companies: "mb_companies",
  products: "mb_products",
  invoices: "mb_invoices",
  acts: "mb_acts",
  upds: "mb_upds",
  tabs: "mb_tabs",
  activeTab: "mb_activeTab",
  invoiceCounter: "mb_invoiceCounter",
  actCounter: "mb_actCounter",
  updCounter: "mb_updCounter",
  templates: "mb_templates",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

type Listener = () => void;

class Store {
  private listeners: Set<Listener> = new Set();

  companies: Company[] = [];
  products: Product[] = [];
  invoices: Invoice[] = [];
  acts: Act[] = [];
  upds: UPD[] = [];
  templates: TemplateSettings[] = [];
  tabs: TabItem[] = [];
  activeTabId: string = "";
  invoiceCounter: number = 1;
  actCounter: number = 1;
  updCounter: number = 1;

  constructor() {
    this.companies = load(STORAGE_KEYS.companies, []);
    this.products = load(STORAGE_KEYS.products, []);
    this.invoices = load(STORAGE_KEYS.invoices, []);
    this.acts = load(STORAGE_KEYS.acts, []);
    this.upds = load(STORAGE_KEYS.upds, []);
    this.tabs = load(STORAGE_KEYS.tabs, []);
    this.activeTabId = load(STORAGE_KEYS.activeTab, "");
    this.invoiceCounter = load(STORAGE_KEYS.invoiceCounter, 1);
    this.actCounter = load(STORAGE_KEYS.actCounter, 1);
    this.updCounter = load(STORAGE_KEYS.updCounter, 1);
    this.templates = load(STORAGE_KEYS.templates, []);

    if (this.templates.length === 0) {
      this.seedTemplates();
    }

    if (this.companies.length === 0) {
      this.seed();
    }
    this.migrateData();
  }

  private seedTemplates() {
    this.templates = [
      { id: "tpl-invoice", name: "Счет (стандартный)", docType: "invoice" as DocType, ...DEFAULT_TEMPLATE },
      { id: "tpl-act", name: "Акт (стандартный)", docType: "act" as DocType, ...DEFAULT_TEMPLATE, showBankBlock: false, showQR: false },
      { id: "tpl-upd", name: "УПД (стандартный)", docType: "upd" as DocType, ...DEFAULT_TEMPLATE, showBankBlock: false, showQR: false },
    ];
    save(STORAGE_KEYS.templates, this.templates);
  }

  private migrateData() {
    let changed = false;
    this.companies = this.companies.map((c) => {
      if (!("director" in c)) {
        changed = true;
        return { ...c, director: "", accountant: "" };
      }
      return c;
    });
    this.products = this.products.map((p) => {
      if (!("unit" in p)) {
        changed = true;
        return { ...p, unit: "шт" };
      }
      return p;
    });
    if (changed) this.persist();
  }

  private seed() {
    this.companies = [
      {
        id: "c1",
        name: 'ООО "Ромашка"',
        inn: "7707123456",
        kpp: "770701001",
        bank: "ПАО Сбербанк",
        bik: "044525225",
        rs: "40702810938000012345",
        ks: "30101810400000000225",
        address: "г. Москва, ул. Ленина, д. 1",
        role: "seller",
        director: "Петров А.В.",
        accountant: "Сидорова Е.Н.",
      },
      {
        id: "c2",
        name: "ИП Иванов И.И.",
        inn: "771234567890",
        kpp: "",
        bank: "АО Тинькофф Банк",
        bik: "044525974",
        rs: "40802810100000012345",
        ks: "30101810145250000974",
        address: "г. Москва, ул. Пушкина, д. 5",
        role: "buyer",
        director: "Иванов И.И.",
        accountant: "",
      },
    ];
    this.products = [
      { id: "p1", name: "Консультация (1 час)", price: 500000, vat: 20, barcode: "4600000000001", currency: "RUB", unit: "час" },
      { id: "p2", name: "Разработка сайта", price: 15000000, vat: 20, barcode: "4600000000002", currency: "RUB", unit: "шт" },
    ];
    this.persist();
  }

  private persist() {
    save(STORAGE_KEYS.companies, this.companies);
    save(STORAGE_KEYS.products, this.products);
    save(STORAGE_KEYS.invoices, this.invoices);
    save(STORAGE_KEYS.acts, this.acts);
    save(STORAGE_KEYS.upds, this.upds);
    save(STORAGE_KEYS.tabs, this.tabs);
    save(STORAGE_KEYS.activeTab, this.activeTabId);
    save(STORAGE_KEYS.invoiceCounter, this.invoiceCounter);
    save(STORAGE_KEYS.actCounter, this.actCounter);
    save(STORAGE_KEYS.updCounter, this.updCounter);
    save(STORAGE_KEYS.templates, this.templates);
    this.notify();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  openTab(tab: TabItem) {
    const existing = this.tabs.find((t) => t.id === tab.id);
    if (!existing) {
      this.tabs = [...this.tabs, tab];
    }
    this.activeTabId = tab.id;
    this.persist();
  }

  closeTab(tabId: string) {
    const idx = this.tabs.findIndex((t) => t.id === tabId);
    this.tabs = this.tabs.filter((t) => t.id !== tabId);
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs[Math.min(idx, this.tabs.length - 1)]?.id || "";
    }
    this.persist();
  }

  setActiveTab(tabId: string) {
    this.activeTabId = tabId;
    this.persist();
  }

  saveCompany(company: Company) {
    const idx = this.companies.findIndex((c) => c.id === company.id);
    if (idx >= 0) {
      this.companies = this.companies.map((c) => (c.id === company.id ? company : c));
    } else {
      this.companies = [...this.companies, company];
    }
    this.persist();
  }

  deleteCompany(id: string) {
    this.companies = this.companies.filter((c) => c.id !== id);
    this.persist();
  }

  saveProduct(product: Product) {
    const idx = this.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.products = this.products.map((p) => (p.id === product.id ? product : p));
    } else {
      this.products = [...this.products, product];
    }
    this.persist();
  }

  deleteProduct(id: string) {
    this.products = this.products.filter((p) => p.id !== id);
    this.persist();
  }

  saveInvoice(invoice: Invoice) {
    const idx = this.invoices.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      this.invoices = this.invoices.map((i) => (i.id === invoice.id ? invoice : i));
    } else {
      this.invoices = [...this.invoices, invoice];
    }
    this.persist();
  }

  deleteInvoice(id: string) {
    this.invoices = this.invoices.filter((i) => i.id !== id);
    this.persist();
  }

  saveAct(act: Act) {
    const idx = this.acts.findIndex((a) => a.id === act.id);
    if (idx >= 0) {
      this.acts = this.acts.map((a) => (a.id === act.id ? act : a));
    } else {
      this.acts = [...this.acts, act];
    }
    this.persist();
  }

  deleteAct(id: string) {
    this.acts = this.acts.filter((a) => a.id !== id);
    this.persist();
  }

  saveUpd(upd: UPD) {
    const idx = this.upds.findIndex((u) => u.id === upd.id);
    if (idx >= 0) {
      this.upds = this.upds.map((u) => (u.id === upd.id ? upd : u));
    } else {
      this.upds = [...this.upds, upd];
    }
    this.persist();
  }

  deleteUpd(id: string) {
    this.upds = this.upds.filter((u) => u.id !== id);
    this.persist();
  }

  saveTemplate(tpl: TemplateSettings) {
    const idx = this.templates.findIndex((t) => t.id === tpl.id);
    if (idx >= 0) {
      this.templates = this.templates.map((t) => (t.id === tpl.id ? tpl : t));
    } else {
      this.templates = [...this.templates, tpl];
    }
    this.persist();
  }

  deleteTemplate(id: string) {
    this.templates = this.templates.filter((t) => t.id !== id);
    this.persist();
  }

  getTemplate(docType: DocType): TemplateSettings | undefined {
    return this.templates.find((t) => t.docType === docType);
  }

  nextInvoiceNumber(): string {
    const num = this.invoiceCounter;
    this.invoiceCounter++;
    this.persist();
    return String(num).padStart(4, "0");
  }

  nextActNumber(): string {
    const num = this.actCounter;
    this.actCounter++;
    this.persist();
    return String(num).padStart(4, "0");
  }

  nextUpdNumber(): string {
    const num = this.updCounter;
    this.updCounter++;
    this.persist();
    return String(num).padStart(4, "0");
  }
}

export const store = new Store();