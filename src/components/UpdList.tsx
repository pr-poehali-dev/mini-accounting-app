import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { formatMoney, formatDate, calcLineTotal, generateId } from "@/lib/format";

export default function UpdList() {
  const s = useStore();

  const createNew = () => {
    const id = generateId();
    s.openTab({ id: `upd-${id}`, type: "upd-edit", title: "Новый УПД", entityId: id });
  };

  const openEdit = (upd: typeof s.upds[0]) => {
    s.openTab({ id: `upd-${upd.id}`, type: "upd-edit", title: `УПД №${upd.number}`, entityId: upd.id });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Универсальные передаточные документы</h2>
        <Button size="sm" onClick={createNew}><Icon name="Plus" size={14} className="mr-1" /> Создать УПД</Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-medium">№</th>
              <th className="text-left px-3 py-2 font-medium">Дата</th>
              <th className="text-left px-3 py-2 font-medium">Покупатель</th>
              <th className="text-center px-3 py-2 font-medium">Статус</th>
              <th className="text-right px-3 py-2 font-medium">Сумма</th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {s.upds.map((upd) => {
              const buyer = s.companies.find((c) => c.id === upd.buyerId);
              const total = upd.lines.reduce((sum, l) => sum + calcLineTotal(l.price, l.quantity), 0);
              return (
                <tr key={upd.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(upd)}>
                  <td className="px-3 py-2 font-mono">{upd.number}</td>
                  <td className="px-3 py-2">{formatDate(upd.date)}</td>
                  <td className="px-3 py-2">{buyer?.name || "—"}</td>
                  <td className="px-3 py-2 text-center"><span className="px-2 py-0.5 rounded bg-muted text-xs">{upd.status}</span></td>
                  <td className="px-3 py-2 text-right font-medium">{formatMoney(total, upd.currency)}</td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); s.deleteUpd(upd.id); }}>
                      <Icon name="Trash2" size={14} className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {s.upds.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Нет УПД</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}