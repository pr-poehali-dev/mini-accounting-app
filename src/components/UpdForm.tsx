import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { UPD, Currency } from "@/lib/types";
import { generateId, formatMoney, calcLineTotal, calcLineVat, formatDate } from "@/lib/format";
import { exportUpdExcel, exportUpdXML } from "@/lib/export-utils";
import { printUPD1C } from "@/lib/print-templates";
import { renderDocWithTemplate } from "@/lib/template-renderer";
import { store as rawStore } from "@/lib/store";
import DocLinesEditor from "./DocLinesEditor";
import { useState, useEffect, useRef } from "react";

export default function UpdForm({ entityId }: { entityId?: string }) {
  const s = useStore();
  const existing = entityId ? s.upds.find((u) => u.id === entityId) : null;
  const numRef = useRef(existing ? existing.number : rawStore.nextUpdNumber());

  const [form, setForm] = useState<UPD>(() => {
    if (existing) return { ...existing, lines: existing.lines.map((l) => ({ ...l })) };
    return {
      id: entityId || generateId(),
      number: numRef.current,
      date: new Date().toISOString().slice(0, 10),
      sellerId: rawStore.companies.find((c) => c.role === "seller")?.id || "",
      buyerId: rawStore.companies.find((c) => c.role === "buyer")?.id || "",
      lines: [],
      currency: "RUB",
      correctionNumber: "",
      status: "1",
    };
  });

  const [saved, setSaved] = useState(!!existing);

  useEffect(() => {
    if (existing) setForm({ ...existing, lines: existing.lines.map((l) => ({ ...l })) });
  }, [entityId]);

  const update = (field: keyof UPD, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const grandTotal = form.lines.reduce((a, l) => a + calcLineTotal(l.price, l.quantity), 0);
  const grandVat = form.lines.reduce((a, l) => a + calcLineVat(l.price, l.quantity, l.vat), 0);

  const handleSave = () => { s.saveUpd(form); setSaved(true); };

  const updTemplates = s.templates.filter((t) => t.docType === "upd");

  const getHTML = (tplId?: string) => {
    const tpl = tplId ? s.templates.find((t) => t.id === tplId) : undefined;
    if (tpl) return renderDocWithTemplate(tpl, form, s.companies, s.products);
    return printUPD1C(form, s.companies, s.products);
  };

  const handlePrint = (tplId?: string) => {
    const html = getHTML(tplId);
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 300); }
  };

  const handlePreview = (tplId?: string) => {
    const html = getHTML(tplId);
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const sellers = s.companies.filter((c) => c.role === "seller");
  const buyers = s.companies.filter((c) => c.role === "buyer");

  return (
    <div className="p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">УПД №{form.number} от {formatDate(form.date)}</h2>
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Icon name="Check" size={14} /> Сохранено</span>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label className="text-xs mb-1">Дата</Label>
          <Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs mb-1">Статус УПД</Label>
          <div className="flex gap-2">
            <Button size="sm" variant={form.status === "1" ? "default" : "outline"} onClick={() => update("status", "1")}>
              1 — СФ + Акт
            </Button>
            <Button size="sm" variant={form.status === "2" ? "default" : "outline"} onClick={() => update("status", "2")}>
              2 — Только акт
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1">Валюта</Label>
          <div className="flex gap-1">
            {(["RUB", "USD", "EUR"] as Currency[]).map((c) => (
              <Button key={c} size="sm" variant={form.currency === c ? "default" : "outline"} onClick={() => update("currency", c)}>{c}</Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1">Исправление №</Label>
          <Input value={form.correctionNumber} onChange={(e) => update("correctionNumber", e.target.value)} placeholder="—" />
        </div>
        <div>
          <Label className="text-xs mb-1">Продавец</Label>
          <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.sellerId} onChange={(e) => update("sellerId", e.target.value)}>
            <option value="">— Выберите —</option>
            {sellers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs mb-1">Покупатель</Label>
          <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.buyerId} onChange={(e) => update("buyerId", e.target.value)}>
            <option value="">— Выберите —</option>
            {buyers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <DocLinesEditor
        lines={form.lines}
        products={s.products}
        currency={form.currency}
        onChange={(lines) => { setForm((prev) => ({ ...prev, lines })); setSaved(false); }}
      />

      {form.lines.length > 0 && (
        <div className="flex flex-col items-end mb-4 text-sm space-y-1">
          <div className="text-muted-foreground">НДС: {formatMoney(grandVat, form.currency)}</div>
          <div className="text-lg font-bold">Итого: {formatMoney(grandTotal, form.currency)}</div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={handleSave}><Icon name="Save" size={14} className="mr-1" /> Сохранить</Button>
        <Button variant="outline" onClick={() => handlePrint()}><Icon name="Printer" size={14} className="mr-1" /> Печать</Button>
        <Button variant="outline" onClick={() => handlePreview()}><Icon name="Eye" size={14} className="mr-1" /> Предпросмотр</Button>
        <Button variant="outline" onClick={() => exportUpdExcel(form, s.companies, s.products)}><Icon name="Table" size={14} className="mr-1" /> Excel</Button>
        <Button variant="outline" onClick={() => exportUpdXML(form, s.companies, s.products)}><Icon name="Code" size={14} className="mr-1" /> XML</Button>
      </div>

      {updTemplates.length > 0 && (
        <div className="border rounded-lg p-3 bg-muted/10">
          <Label className="text-xs text-muted-foreground mb-2 block">Печать по шаблону:</Label>
          <div className="flex flex-wrap gap-2">
            {updTemplates.map((tpl) => (
              <div key={tpl.id} className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => handlePreview(tpl.id)}><Icon name="Eye" size={12} className="mr-1" />{tpl.name}</Button>
                <Button size="sm" variant="ghost" onClick={() => handlePrint(tpl.id)}><Icon name="Printer" size={12} /></Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}