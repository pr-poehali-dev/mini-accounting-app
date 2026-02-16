import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { Company } from "@/lib/types";
import { generateId } from "@/lib/format";
import { useState, useEffect } from "react";

const EMPTY: Company = {
  id: "", name: "", inn: "", kpp: "", bank: "", bik: "", rs: "", ks: "",
  address: "", role: "buyer", director: "", accountant: "",
};

export default function CompanyForm({ entityId }: { entityId?: string }) {
  const s = useStore();
  const [form, setForm] = useState<Company>({ ...EMPTY, id: generateId() });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (entityId) {
      const found = s.companies.find((c) => c.id === entityId);
      if (found) setForm({ ...found });
    }
  }, [entityId]);

  const update = (field: keyof Company, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    s.saveCompany(form);
    setSaved(true);
    const tab = s.tabs.find((t) => t.entityId === entityId || t.id.includes("new"));
    if (tab) {
      tab.title = form.name || "Фирма";
      tab.entityId = form.id;
    }
  };

  const fields: { key: keyof Company; label: string; placeholder: string }[] = [
    { key: "name", label: "Название", placeholder: 'ООО "Ромашка"' },
    { key: "inn", label: "ИНН", placeholder: "7707123456" },
    { key: "kpp", label: "КПП", placeholder: "770701001" },
    { key: "address", label: "Адрес", placeholder: "г. Москва, ул. Ленина, д. 1" },
    { key: "bank", label: "Банк", placeholder: "ПАО Сбербанк" },
    { key: "bik", label: "БИК", placeholder: "044525225" },
    { key: "rs", label: "Р/с", placeholder: "40702810938000012345" },
    { key: "ks", label: "К/с", placeholder: "30101810400000000225" },
    { key: "director", label: "Руководитель", placeholder: "Петров А.В." },
    { key: "accountant", label: "Бухгалтер", placeholder: "Сидорова Е.Н." },
  ];

  return (
    <div className="p-4 max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{entityId ? "Редактирование фирмы" : "Новая фирма"}</h2>
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Icon name="Check" size={14} /> Сохранено</span>}
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs mb-1">Роль</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={form.role === "seller" ? "default" : "outline"}
              onClick={() => update("role", "seller")}
            >
              Продавец
            </Button>
            <Button
              size="sm"
              variant={form.role === "buyer" ? "default" : "outline"}
              onClick={() => update("role", "buyer")}
            >
              Покупатель
            </Button>
          </div>
        </div>

        {fields.map((f) => (
          <div key={f.key}>
            <Label className="text-xs mb-1">{f.label}</Label>
            <Input
              value={String(form[f.key])}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Button onClick={handleSave}>
          <Icon name="Save" size={14} className="mr-1" /> Сохранить
        </Button>
      </div>
    </div>
  );
}