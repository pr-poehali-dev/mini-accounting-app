import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { formatMoney, formatDate, calcLineTotal, generateId } from "@/lib/format";

export default function InvoiceList() {
  const s = useStore();

  const createNew = () => {
    const id = generateId();
    s.openTab({
      id: `invoice-${id}`,
      type: "invoice-edit",
      title: "Новый счет",
      entityId: id,
    });
  };

  const openEdit = (inv: typeof s.invoices[0]) => {
    s.openTab({
      id: `invoice-${inv.id}`,
      type: "invoice-edit",
      title: `Счет №${inv.number}`,
      entityId: inv.id,
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Счета на оплату</h2>
        <Button size="sm" onClick={createNew}>
          <Icon name="Plus" size={14} className="mr-1" /> Создать счет
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-medium">№</th>
              <th className="text-left px-3 py-2 font-medium">Дата</th>
              <th className="text-left px-3 py-2 font-medium">Покупатель</th>
              <th className="text-right px-3 py-2 font-medium">Сумма</th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {s.invoices.map((inv) => {
              const buyer = s.companies.find((c) => c.id === inv.buyerId);
              const total = inv.lines.reduce((sum, l) => sum + calcLineTotal(l.price, l.quantity), 0);
              return (
                <tr key={inv.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(inv)}>
                  <td className="px-3 py-2 font-mono">{inv.number}</td>
                  <td className="px-3 py-2">{formatDate(inv.date)}</td>
                  <td className="px-3 py-2">{buyer?.name || "—"}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatMoney(total, inv.currency)}</td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        s.deleteInvoice(inv.id);
                      }}
                    >
                      <Icon name="Trash2" size={14} className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {s.invoices.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Нет счетов</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}