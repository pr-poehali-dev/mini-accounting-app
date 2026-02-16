import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { formatMoney, generateId } from "@/lib/format";

export default function ProductList() {
  const s = useStore();

  const openEdit = (id?: string) => {
    const tabId = id ? `product-${id}` : `product-new-${generateId()}`;
    s.openTab({
      id: tabId,
      type: "product-edit",
      title: id ? s.products.find((p) => p.id === id)?.name || "Товар" : "Новый товар",
      entityId: id,
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Товары / Услуги</h2>
        <Button size="sm" onClick={() => openEdit()}>
          <Icon name="Plus" size={14} className="mr-1" /> Добавить
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-medium">Наименование</th>
              <th className="text-left px-3 py-2 font-medium">Штрих-код</th>
              <th className="text-right px-3 py-2 font-medium">Цена</th>
              <th className="text-right px-3 py-2 font-medium">НДС</th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {s.products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(p.id)}>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{p.barcode}</td>
                <td className="px-3 py-2 text-right">{formatMoney(p.price, p.currency)}</td>
                <td className="px-3 py-2 text-right">{p.vat}%</td>
                <td className="px-3 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      s.deleteProduct(p.id);
                    }}
                  >
                    <Icon name="Trash2" size={14} className="text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {s.products.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Нет товаров</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
