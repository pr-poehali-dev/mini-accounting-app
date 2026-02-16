import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { formatMoney, formatDate, calcLineTotal, generateId } from "@/lib/format";

export default function ActList() {
  const s = useStore();

  const createNew = () => {
    const id = generateId();
    s.openTab({ id: `act-${id}`, type: "act-edit", title: "Новый акт", entityId: id });
  };

  const openEdit = (act: typeof s.acts[0]) => {
    s.openTab({ id: `act-${act.id}`, type: "act-edit", title: `Акт №${act.number}`, entityId: act.id });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Акты выполненных работ</h2>
        <Button size="sm" onClick={createNew}><Icon name="Plus" size={14} className="mr-1" /> Создать акт</Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-medium">№</th>
              <th className="text-left px-3 py-2 font-medium">Дата</th>
              <th className="text-left px-3 py-2 font-medium">Заказчик</th>
              <th className="text-left px-3 py-2 font-medium">Договор</th>
              <th className="text-right px-3 py-2 font-medium">Сумма</th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {s.acts.map((act) => {
              const buyer = s.companies.find((c) => c.id === act.buyerId);
              const total = act.lines.reduce((sum, l) => sum + calcLineTotal(l.price, l.quantity), 0);
              return (
                <tr key={act.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(act)}>
                  <td className="px-3 py-2 font-mono">{act.number}</td>
                  <td className="px-3 py-2">{formatDate(act.date)}</td>
                  <td className="px-3 py-2">{buyer?.name || "—"}</td>
                  <td className="px-3 py-2">{act.contractNumber ? `№${act.contractNumber}` : "—"}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatMoney(total, act.currency)}</td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); s.deleteAct(act.id); }}>
                      <Icon name="Trash2" size={14} className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {s.acts.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Нет актов</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}