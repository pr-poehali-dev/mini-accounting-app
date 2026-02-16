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

export type TabType =
  | "companies" | "products"
  | "invoices" | "acts" | "upds"
  | "company-edit" | "product-edit"
  | "invoice-edit" | "act-edit" | "upd-edit";

export interface TabItem {
  id: string;
  type: TabType;
  title: string;
  entityId?: string;
}
