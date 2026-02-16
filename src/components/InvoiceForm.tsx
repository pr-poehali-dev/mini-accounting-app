import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { Invoice, InvoiceLine, Currency } from "@/lib/types";
import { generateId, formatMoney, calcLineTotal, calcLineVat, formatDate } from "@/lib/format";
import {
  generateQRString,
  generateQRDataUrl,
  exportExcel,
  exportXML,
  generatePrintHTML,
} from "@/lib/export-utils";
import { useState, useEffect, useMemo } from "react";

export default function InvoiceForm({ entityId }: { entityId?: string }) {
  const s = useStore();

  const existing = entityId ? s.invoices.find((i) => i.id === entityId) : null;

  const [form, setForm] = useState<Invoice>(() => {
    if (existing) return { ...existing, lines: existing.lines.map((l) => ({ ...l })) };
    return {
      id: entityId || generateId(),
      number: s.nextInvoiceNumber(),
      date: new Date().toISOString().slice(0, 10),
      sellerId: s.companies.find((c) => c.role === "seller")?.id || "",
      buyerId: s.companies.find((c) => c.role === "buyer")?.id || "",
      lines: [],
      currency: "RUB",
    };
  });

  const [saved, setSaved] = useState(!!existing);

  useEffect(() => {
    if (existing) {
      setForm({ ...existing, lines: existing.lines.map((l) => ({ ...l })) });
    }
  }, [entityId]);

  const update = (field: keyof Invoice, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const addLine = () => {
    const product = s.products[0];
    if (!product) return;
    const line: InvoiceLine = {
      id: generateId(),
      productId: product.id,
      quantity: 1,
      price: product.price,
      vat: product.vat,
    };
    setForm((prev) => ({ ...prev, lines: [...prev.lines, line] }));
    setSaved(false);
  };

  const updateLine = (lineId: string, field: keyof InvoiceLine, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => {
        if (l.id !== lineId) return l;
        const updated = { ...l, [field]: value };
        if (field === "productId") {
          const p = s.products.find((pr) => pr.id === value);
          if (p) {
            updated.price = p.price;
            updated.vat = p.vat;
          }
        }
        return updated;
      }),
    }));
    setSaved(false);
  };

  const removeLine = (lineId: string) => {
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((l) => l.id !== lineId) }));
    setSaved(false);
  };

  const grandTotal = form.lines.reduce((s, l) => s + calcLineTotal(l.price, l.quantity), 0);
  const grandVat = form.lines.reduce((s, l) => s + calcLineVat(l.price, l.quantity, l.vat), 0);

  const qrDataUrl = useMemo(() => {
    const qrStr = generateQRString(form, s.companies);
    return qrStr ? generateQRDataUrl(qrStr) : "";
  }, [form.sellerId, form.lines, form.number, form.date, s.companies]);

  const handleSave = () => {
    s.saveInvoice(form);
    setSaved(true);
  };

  const handlePrint = () => {
    const html = generatePrintHTML(form, s.companies, s.products);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  };

  const handlePDF = () => {
    const html = generatePrintHTML(form, s.companies, s.products);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const sellers = s.companies.filter((c) => c.role === "seller");
  const buyers = s.companies.filter((c) => c.role === "buyer");

  return (
    <div className="p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Счет №{form.number} от {formatDate(form.date)}</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Icon name="Check" size={14} /> Сохранено</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label className="text-xs mb-1">Дата</Label>
          <Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs mb-1">Валюта</Label>
          <div className="flex gap-1">
            {(["RUB", "USD", "EUR"] as Currency[]).map((c) => (
              <Button key={c} size="sm" variant={form.currency === c ? "default" : "outline"} onClick={() => update("currency", c)}>
                {c}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1">Продавец</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={form.sellerId}
            onChange={(e) => update("sellerId", e.target.value)}
          >
            <option value="">— Выберите —</option>
            {sellers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs mb-1">Покупатель</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={form.buyerId}
            onChange={(e) => update("buyerId", e.target.value)}
          >
            <option value="">— Выберите —</option>
            {buyers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="font-medium">Строки счета</Label>
          <Button size="sm" variant="outline" onClick={addLine} disabled={s.products.length === 0}>
            <Icon name="Plus" size={14} className="mr-1" /> Добавить строку
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-2 py-2 font-medium">Товар/Услуга</th>
                <th className="text-right px-2 py-2 font-medium w-20">Кол-во</th>
                <th className="text-right px-2 py-2 font-medium w-28">Цена</th>
                <th className="text-right px-2 py-2 font-medium w-16">НДС</th>
                <th className="text-right px-2 py-2 font-medium w-28">Сумма</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line) => (
                <tr key={line.id} className="border-t">
                  <td className="px-2 py-1">
                    <select
                      className="w-full h-8 rounded border border-input bg-background px-2 text-sm"
                      value={line.productId}
                      onChange={(e) => updateLine(line.id, "productId", e.target.value)}
                    >
                      {s.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      type="number"
                      min={1}
                      className="h-8 text-right"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-xs">{formatMoney(line.price, form.currency)}</td>
                  <td className="px-2 py-1 text-right">{line.vat}%</td>
                  <td className="px-2 py-1 text-right font-medium">{formatMoney(calcLineTotal(line.price, line.quantity), form.currency)}</td>
                  <td className="px-2 py-1">
                    <Button variant="ghost" size="sm" onClick={() => removeLine(line.id)}>
                      <Icon name="X" size={14} className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {form.lines.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Добавьте строки в счет</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {form.lines.length > 0 && (
          <div className="flex flex-col items-end mt-3 text-sm space-y-1">
            <div className="text-muted-foreground">НДС: {formatMoney(grandVat, form.currency)}</div>
            <div className="text-lg font-bold">Итого: {formatMoney(grandTotal, form.currency)}</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={handleSave}>
          <Icon name="Save" size={14} className="mr-1" /> Сохранить
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Icon name="Printer" size={14} className="mr-1" /> Печать
        </Button>
        <Button variant="outline" onClick={handlePDF}>
          <Icon name="FileText" size={14} className="mr-1" /> PDF
        </Button>
        <Button variant="outline" onClick={() => exportExcel(form, s.companies, s.products)}>
          <Icon name="Table" size={14} className="mr-1" /> Excel
        </Button>
        <Button variant="outline" onClick={() => exportXML(form, s.companies, s.products)}>
          <Icon name="Code" size={14} className="mr-1" /> XML
        </Button>
      </div>

      {qrDataUrl && form.lines.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-start gap-4">
            <img src={qrDataUrl} alt="QR для оплаты" className="w-32 h-32" />
            <div className="text-sm">
              <p className="font-medium mb-1">QR-код для оплаты (ST00012)</p>
              <p className="text-muted-foreground">Отсканируйте в мобильном банке для оплаты счета №{form.number}</p>
              <p className="text-muted-foreground mt-1">Сумма: <span className="font-medium text-foreground">{formatMoney(grandTotal, form.currency)}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
