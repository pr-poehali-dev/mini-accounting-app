import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { Act, Currency } from "@/lib/types";
import { generateId, formatMoney, calcLineTotal, calcLineVat, formatDate } from "@/lib/format";
import { exportActExcel, exportActXML } from "@/lib/export-utils";
import { printAct1C } from "@/lib/print-templates";
import { renderDocWithTemplate } from "@/lib/template-renderer";
import { store as rawStore } from "@/lib/store";
import DocLinesEditor from "./DocLinesEditor";
import { useState, useEffect, useRef } from "react";

export default function ActForm({ entityId }: { entityId?: string }) {
  const s = useStore();
  const existing = entityId ? s.acts.find((a) => a.id === entityId) : null;
  const numRef = useRef(existing ? existing.number : rawStore.nextActNumber());

  const [form, setForm] = useState<Act>(() => {
    if (existing) return { ...existing, lines: existing.lines.map((l) => ({ ...l })) };
    return {
      id: entityId || generateId(),
      number: numRef.current,
      date: new Date().toISOString().slice(0, 10),
      sellerId: rawStore.companies.find((c) => c.role === "seller")?.id || "",
      buyerId: rawStore.companies.find((c) => c.role === "buyer")?.id || "",
      lines: [],
      currency: "RUB",
      contractNumber: "",
      contractDate: "",
    };
  });

  const [saved, setSaved] = useState(!!existing);

  useEffect(() => {
    if (existing) setForm({ ...existing, lines: existing.lines.map((l) => ({ ...l })) });
  }, [entityId]);

  const update = (field: keyof Act, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const grandTotal = form.lines.reduce((a, l) => a + calcLineTotal(l.price, l.quantity), 0);
  const grandVat = form.lines.reduce((a, l) => a + calcLineVat(l.price, l.quantity, l.vat), 0);

  const handleSave = () => { s.saveAct(form); setSaved(true); };

  const actTemplates = s.templates.filter((t) => t.docType === "act");

  const getHTML = (tplId?: string) => {
    const tpl = tplId ? s.templates.find((t) => t.id === tplId) : undefined;
    if (tpl) return renderDocWithTemplate(tpl, form, s.companies, s.products);
    return printAct1C(form, s.companies, s.products);
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
        <h2 className="text-lg font-semibold">Акт №{form.number} от {formatDate(form.date)}</h2>
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Icon name="Check" size={14} /> Сохранено</span>}
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
              <Button key={c} size="sm" variant={form.currency === c ? "default" : "outline"} onClick={() => update("currency", c)}>{c}</Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1">Исполнитель</Label>
          <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.sellerId} onChange={(e) => update("sellerId", e.target.value)}>
            <option value="">— Выберите —</option>
            {sellers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs mb-1">Заказчик</Label>
          <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.buyerId} onChange={(e) => update("buyerId", e.target.value)}>
            <option value="">— Выберите —</option>
            {buyers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs mb-1">Номер договора</Label>
          <Input value={form.contractNumber} onChange={(e) => update("contractNumber", e.target.value)} placeholder="123/2024" />
        </div>
        <div>
          <Label className="text-xs mb-1">Дата договора</Label>
          <Input type="date" value={form.contractDate} onChange={(e) => update("contractDate", e.target.value)} />
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
        <Button variant="outline" onClick={() => exportActExcel(form, s.companies, s.products)}><Icon name="Table" size={14} className="mr-1" /> Excel</Button>
        <Button variant="outline" onClick={() => exportActXML(form, s.companies, s.products)}><Icon name="Code" size={14} className="mr-1" /> XML</Button>
      </div>

      {actTemplates.length > 0 && (
        <div className="border rounded-lg p-3 bg-muted/10">
          <Label className="text-xs text-muted-foreground mb-2 block">Печать по шаблону:</Label>
          <div className="flex flex-wrap gap-2">
            {actTemplates.map((tpl) => (
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