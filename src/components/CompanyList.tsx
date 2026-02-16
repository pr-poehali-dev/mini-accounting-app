import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { generateId } from "@/lib/format";

export default function CompanyList() {
  const s = useStore();

  const openEdit = (id?: string) => {
    const tabId = id ? `company-${id}` : `company-new-${generateId()}`;
    s.openTab({
      id: tabId,
      type: "company-edit",
      title: id ? s.companies.find((c) => c.id === id)?.name || "Фирма" : "Новая фирма",
      entityId: id,
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Фирмы</h2>
        <Button size="sm" onClick={() => openEdit()}>
          <Icon name="Plus" size={14} className="mr-1" /> Добавить
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-medium">Название</th>
              <th className="text-left px-3 py-2 font-medium">ИНН</th>
              <th className="text-left px-3 py-2 font-medium">Роль</th>
              <th className="text-left px-3 py-2 font-medium">Банк</th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {s.companies.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(c.id)}>
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{c.inn}</td>
                <td className="px-3 py-2">{c.role === "seller" ? "Продавец" : "Покупатель"}</td>
                <td className="px-3 py-2">{c.bank}</td>
                <td className="px-3 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      s.deleteCompany(c.id);
                    }}
                  >
                    <Icon name="Trash2" size={14} className="text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {s.companies.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Нет фирм</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
