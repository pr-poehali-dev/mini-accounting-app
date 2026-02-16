import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { DocLine, Currency, Product } from "@/lib/types";
import { formatMoney, calcLineTotal, generateId } from "@/lib/format";

interface Props {
  lines: DocLine[];
  products: Product[];
  currency: Currency;
  onChange: (lines: DocLine[]) => void;
}

export default function DocLinesEditor({ lines, products, currency, onChange }: Props) {
  const addLine = () => {
    const product = products[0];
    if (!product) return;
    onChange([...lines, {
      id: generateId(),
      productId: product.id,
      quantity: 1,
      price: product.price,
      vat: product.vat,
    }]);
  };

  const updateLine = (lineId: string, field: keyof DocLine, value: string | number) => {
    onChange(lines.map((l) => {
      if (l.id !== lineId) return l;
      const updated = { ...l, [field]: value };
      if (field === "productId") {
        const p = products.find((pr) => pr.id === value);
        if (p) { updated.price = p.price; updated.vat = p.vat; }
      }
      return updated;
    }));
  };

  const removeLine = (lineId: string) => {
    onChange(lines.filter((l) => l.id !== lineId));
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="font-medium">Строки документа</Label>
        <Button size="sm" variant="outline" onClick={addLine} disabled={products.length === 0}>
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
            {lines.map((line) => (
              <tr key={line.id} className="border-t">
                <td className="px-2 py-1">
                  <select
                    className="w-full h-8 rounded border border-input bg-background px-2 text-sm"
                    value={line.productId}
                    onChange={(e) => updateLine(line.id, "productId", e.target.value)}
                  >
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                <td className="px-2 py-1 text-right font-mono text-xs">{formatMoney(line.price, currency)}</td>
                <td className="px-2 py-1 text-right">{line.vat}%</td>
                <td className="px-2 py-1 text-right font-medium">{formatMoney(calcLineTotal(line.price, line.quantity), currency)}</td>
                <td className="px-2 py-1">
                  <Button variant="ghost" size="sm" onClick={() => removeLine(line.id)}>
                    <Icon name="X" size={14} className="text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Добавьте строки</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
