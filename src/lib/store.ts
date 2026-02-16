import { Company, Product, Invoice, TabItem } from "./types";

const STORAGE_KEYS = {
  companies: "mb_companies",
  products: "mb_products",
  invoices: "mb_invoices",
  tabs: "mb_tabs",
  activeTab: "mb_activeTab",
  invoiceCounter: "mb_invoiceCounter",
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
  tabs: TabItem[] = [];
  activeTabId: string = "";
  invoiceCounter: number = 1;

  constructor() {
    this.companies = load(STORAGE_KEYS.companies, []);
    this.products = load(STORAGE_KEYS.products, []);
    this.invoices = load(STORAGE_KEYS.invoices, []);
    this.tabs = load(STORAGE_KEYS.tabs, []);
    this.activeTabId = load(STORAGE_KEYS.activeTab, "");
    this.invoiceCounter = load(STORAGE_KEYS.invoiceCounter, 1);

    if (this.companies.length === 0) {
      this.seed();
    }
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
      },
      {
        id: "c2",
        name: 'ИП Иванов И.И.',
        inn: "771234567890",
        kpp: "",
        bank: "АО Тинькофф Банк",
        bik: "044525974",
        rs: "40802810100000012345",
        ks: "30101810145250000974",
        address: "г. Москва, ул. Пушкина, д. 5",
        role: "buyer",
      },
    ];
    this.products = [
      { id: "p1", name: "Консультация (1 час)", price: 500000, vat: 20, barcode: "4600000000001", currency: "RUB" },
      { id: "p2", name: "Разработка сайта", price: 15000000, vat: 20, barcode: "4600000000002", currency: "RUB" },
    ];
    this.persist();
  }

  private persist() {
    save(STORAGE_KEYS.companies, this.companies);
    save(STORAGE_KEYS.products, this.products);
    save(STORAGE_KEYS.invoices, this.invoices);
    save(STORAGE_KEYS.tabs, this.tabs);
    save(STORAGE_KEYS.activeTab, this.activeTabId);
    save(STORAGE_KEYS.invoiceCounter, this.invoiceCounter);
    this.notify();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Tabs
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

  // Companies
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

  // Products
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

  // Invoices
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

  nextInvoiceNumber(): string {
    const num = this.invoiceCounter;
    this.invoiceCounter++;
    this.persist();
    return String(num).padStart(4, "0");
  }
}

export const store = new Store();
