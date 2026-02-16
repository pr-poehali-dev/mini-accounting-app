import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { TemplateSettings, DEFAULT_TEMPLATE, DocType } from "@/lib/types";
import { generateId } from "@/lib/format";
import { buildPreviewHTML } from "@/lib/template-renderer";
import { useState, useEffect, useRef } from "react";

const FONTS = ["Times New Roman", "Arial", "IBM Plex Sans", "Courier New", "Georgia", "Verdana"];
const DOC_LABELS: Record<DocType, string> = { invoice: "Счет", act: "Акт", upd: "УПД" };

export default function TemplateEditor({ entityId }: { entityId?: string }) {
  const s = useStore();
  const existing = entityId ? s.templates.find((t) => t.id === entityId) : null;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [form, setForm] = useState<TemplateSettings>(() => {
    if (existing) return { ...existing };
    return {
      id: entityId || generateId(),
      name: "Новый шаблон",
      docType: "invoice",
      ...DEFAULT_TEMPLATE,
    };
  });

  const [saved, setSaved] = useState(!!existing);

  useEffect(() => {
    if (existing) setForm({ ...existing });
  }, [entityId]);

  useEffect(() => {
    if (iframeRef.current) {
      const html = buildPreviewHTML(form, s.companies, s.products);
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [form, s.companies, s.products]);

  const update = <K extends keyof TemplateSettings>(field: K, value: TemplateSettings[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    s.saveTemplate(form);
    setSaved(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update("logoUrl", reader.result as string);
      update("showLogo", true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-full">
      <div className="w-80 min-w-80 border-r overflow-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Настройки шаблона</h2>
          {saved && <span className="text-xs text-green-600 flex items-center gap-1"><Icon name="Check" size={12} /></span>}
        </div>

        <div>
          <Label className="text-xs">Название шаблона</Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>

        <div>
          <Label className="text-xs">Тип документа</Label>
          <div className="flex gap-1 mt-1">
            {(["invoice", "act", "upd"] as DocType[]).map((dt) => (
              <Button key={dt} size="sm" variant={form.docType === dt ? "default" : "outline"} onClick={() => update("docType", dt)}>
                {DOC_LABELS[dt]}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t pt-3">
          <Label className="text-xs font-medium text-muted-foreground">ОФОРМЛЕНИЕ</Label>
        </div>

        <div>
          <Label className="text-xs">Шрифт</Label>
          <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.font} onChange={(e) => update("font", e.target.value)}>
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Размер шрифта</Label>
            <Input type="number" min={8} max={16} value={form.fontSize} onChange={(e) => update("fontSize", parseInt(e.target.value) || 11)} />
          </div>
          <div>
            <Label className="text-xs">Заголовок</Label>
            <Input type="number" min={10} max={24} value={form.titleFontSize} onChange={(e) => update("titleFontSize", parseInt(e.target.value) || 14)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Поля (мм)</Label>
            <Input type="number" min={5} max={30} value={form.pageMargin} onChange={(e) => update("pageMargin", parseInt(e.target.value) || 15)} />
          </div>
          <div>
            <Label className="text-xs">Фон шапки таблицы</Label>
            <div className="flex gap-1 items-center mt-1">
              <input type="color" value={form.tableHeaderBg} onChange={(e) => update("tableHeaderBg", e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
              <span className="text-xs text-muted-foreground">{form.tableHeaderBg}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-3">
          <Label className="text-xs font-medium text-muted-foreground">БЛОКИ</Label>
        </div>

        <div className="space-y-2">
          {[
            { key: "showBankBlock" as const, label: "Банковские реквизиты", icon: "Landmark" },
            { key: "showQR" as const, label: "QR-код для оплаты", icon: "QrCode" },
            { key: "showSignatures" as const, label: "Подписи", icon: "PenTool" },
            { key: "showStamp" as const, label: "Место для печати (М.П.)", icon: "Stamp" },
            { key: "showAmountWords" as const, label: "Сумма прописью", icon: "Type" },
            { key: "showItemNumbers" as const, label: "Нумерация строк", icon: "Hash" },
            { key: "showLogo" as const, label: "Логотип", icon: "Image" },
          ].map(({ key, label, icon }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1.5 transition-colors">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => update(key, e.target.checked)}
                className="rounded border-input"
              />
              <Icon name={icon} size={14} className="text-muted-foreground" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        {form.showLogo && (
          <div>
            <Label className="text-xs">Логотип (изображение)</Label>
            <Input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs" />
            {form.logoUrl && <img src={form.logoUrl} alt="Лого" className="mt-2 h-12 object-contain" />}
          </div>
        )}

        <div className="border-t pt-3">
          <Label className="text-xs font-medium text-muted-foreground">ТЕКСТЫ</Label>
        </div>

        <div>
          <Label className="text-xs">Текст в шапке</Label>
          <Textarea value={form.headerText} onChange={(e) => update("headerText", e.target.value)} placeholder="Дополнительный текст сверху" rows={2} />
        </div>

        <div>
          <Label className="text-xs">Текст в подвале</Label>
          <Textarea value={form.footerText} onChange={(e) => update("footerText", e.target.value)} placeholder="Примечание к документу" rows={2} />
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} className="w-full">
            <Icon name="Save" size={14} className="mr-1" /> Сохранить шаблон
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-muted/20 p-4 overflow-auto">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Icon name="Eye" size={12} /> Предпросмотр
        </div>
        <div className="bg-white shadow-lg mx-auto" style={{ width: "595px", minHeight: "842px" }}>
          <iframe
            ref={iframeRef}
            title="preview"
            className="w-full border-0"
            style={{ height: "842px" }}
          />
        </div>
      </div>
    </div>
  );
}
