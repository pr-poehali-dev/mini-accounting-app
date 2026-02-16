export interface Company {
  id: string;
  name: string;
  inn: string;
  kpp: string;
  bank: string;
  bik: string;
  rs: string;
  ks: string;
  address: string;
  role: "seller" | "buyer";
  director: string;
  accountant: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  vat: number;
  barcode: string;
  currency: Currency;
  unit: string;
}

export type Currency = "RUB" | "USD" | "EUR";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
};

export interface DocLine {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  vat: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  sellerId: string;
  buyerId: string;
  lines: DocLine[];
  currency: Currency;
}

export interface Act {
  id: string;
  number: string;
  date: string;
  sellerId: string;
  buyerId: string;
  lines: DocLine[];
  currency: Currency;
  contractNumber: string;
  contractDate: string;
}

export interface UPD {
  id: string;
  number: string;
  date: string;
  sellerId: string;
  buyerId: string;
  lines: DocLine[];
  currency: Currency;
  correctionNumber: string;
  status: "1" | "2";
}

export type DocType = "invoice" | "act" | "upd";

export interface TemplateSettings {
  id: string;
  name: string;
  docType: DocType;
  font: string;
  fontSize: number;
  showLogo: boolean;
  logoUrl: string;
  showBankBlock: boolean;
  showQR: boolean;
  showSignatures: boolean;
  showStamp: boolean;
  showAmountWords: boolean;
  showItemNumbers: boolean;
  headerText: string;
  footerText: string;
  pageMargin: number;
  tableHeaderBg: string;
  titleFontSize: number;
}

export const DEFAULT_TEMPLATE: Omit<TemplateSettings, "id" | "name" | "docType"> = {
  font: "Times New Roman",
  fontSize: 11,
  showLogo: false,
  logoUrl: "",
  showBankBlock: true,
  showQR: true,
  showSignatures: true,
  showStamp: true,
  showAmountWords: true,
  showItemNumbers: true,
  headerText: "",
  footerText: "",
  pageMargin: 15,
  tableHeaderBg: "#e8e8e8",
  titleFontSize: 14,
};

export type TabType =
  | "companies" | "products"
  | "invoices" | "acts" | "upds"
  | "company-edit" | "product-edit"
  | "invoice-edit" | "act-edit" | "upd-edit"
  | "templates" | "template-edit";

export interface TabItem {
  id: string;
  type: TabType;
  title: string;
  entityId?: string;
}