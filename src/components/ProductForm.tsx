import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { Product, Currency } from "@/lib/types";
import { generateId } from "@/lib/format";
import { useState, useEffect } from "react";

const EMPTY: Product = {
  id: "",
  name: "",
  price: 0,
  vat: 20,
  barcode: "",
  currency: "RUB",
  unit: "шт",
};

export default function ProductForm({ entityId }: { entityId?: string }) {
  const s = useStore();
  const [form, setForm] = useState<Product>({ ...EMPTY, id: generateId() });
  const [priceStr, setPriceStr] = useState("0");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (entityId) {
      const found = s.products.find((p) => p.id === entityId);
      if (found) {
        setForm({ ...found });
        setPriceStr((found.price / 100).toString());
      }
    }
  }, [entityId]);

  const update = (field: keyof Product, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    s.saveProduct(form);
    setSaved(true);
  };

  return (
    <div className="p-4 max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{entityId ? "Редактирование товара" : "Новый товар"}</h2>
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Icon name="Check" size={14} /> Сохранено</span>}
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs mb-1">Наименование</Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Консультация (1 час)" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1">Цена</Label>
            <Input
              type="number"
              step="0.01"
              value={priceStr}
              onChange={(e) => {
                setPriceStr(e.target.value);
                update("price", Math.round(parseFloat(e.target.value || "0") * 100));
              }}
              placeholder="5000.00"
            />
          </div>
          <div>
            <Label className="text-xs mb-1">Валюта</Label>
            <div className="flex gap-1">
              {(["RUB", "USD", "EUR"] as Currency[]).map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={form.currency === c ? "default" : "outline"}
                  onClick={() => update("currency", c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1">Ставка НДС (%)</Label>
            <div className="flex gap-1">
              {[0, 10, 20].map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={form.vat === v ? "default" : "outline"}
                  onClick={() => update("vat", v)}
                >
                  {v}%
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1">Штрих-код</Label>
            <Input value={form.barcode} onChange={(e) => update("barcode", e.target.value)} placeholder="4600000000001" />
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1">Единица измерения</Label>
          <div className="flex gap-1">
            {["шт", "час", "усл", "м", "кг", "л"].map((u) => (
              <Button key={u} size="sm" variant={form.unit === u ? "default" : "outline"} onClick={() => update("unit", u)}>{u}</Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button onClick={handleSave}>
          <Icon name="Save" size={14} className="mr-1" /> Сохранить
        </Button>
      </div>
    </div>
  );
}