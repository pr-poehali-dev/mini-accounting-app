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
}

export interface Product {
  id: string;
  name: string;
  price: number; // в копейках
  vat: number; // ставка НДС в процентах (0, 10, 20)
  barcode: string;
  currency: Currency;
}

export type Currency = "RUB" | "USD" | "EUR";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
};

export interface InvoiceLine {
  id: string;
  productId: string;
  quantity: number;
  price: number; // в копейках
  vat: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  sellerId: string;
  buyerId: string;
  lines: InvoiceLine[];
  currency: Currency;
}

export interface TabItem {
  id: string;
  type: "companies" | "products" | "invoices" | "company-edit" | "product-edit" | "invoice-edit";
  title: string;
  entityId?: string;
}
