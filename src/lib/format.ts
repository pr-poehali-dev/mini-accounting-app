import { Currency, CURRENCY_SYMBOLS } from "./types";

export function formatMoney(kopecks: number, currency: Currency = "RUB"): string {
  const value = kopecks / 100;
  const sym = CURRENCY_SYMBOLS[currency];
  return value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + sym;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU");
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function calcLineTotal(price: number, qty: number): number {
  return price * qty;
}

export function calcLineVat(price: number, qty: number, vatRate: number): number {
  const total = price * qty;
  return Math.round((total * vatRate) / (100 + vatRate));
}

export function calcLineTotalWithoutVat(price: number, qty: number, vatRate: number): number {
  const total = price * qty;
  const vat = Math.round((total * vatRate) / (100 + vatRate));
  return total - vat;
}
