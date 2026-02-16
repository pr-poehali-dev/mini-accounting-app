import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { generateId } from "@/lib/format";
import { DEFAULT_TEMPLATE, DocType } from "@/lib/types";

const DOC_LABELS: Record<DocType, string> = { invoice: "Счет", act: "Акт", upd: "УПД" };

export default function TemplateList() {
  const s = useStore();

  const createNew = (docType: DocType) => {
    const id = generateId();
    s.openTab({
      id: `template-${id}`,
      type: "template-edit",
      title: `Новый шаблон (${DOC_LABELS[docType]})`,
      entityId: id,
    });
  };

  const openEdit = (tpl: typeof s.templates[0]) => {
    s.openTab({
      id: `template-${tpl.id}`,
      type: "template-edit",
      title: tpl.name,
      entityId: tpl.id,
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Шаблоны печатных форм</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => createNew("invoice")}>
            <Icon name="Plus" size={14} className="mr-1" /> Счет
          </Button>
          <Button size="sm" variant="outline" onClick={() => createNew("act")}>
            <Icon name="Plus" size={14} className="mr-1" /> Акт
          </Button>
          <Button size="sm" variant="outline" onClick={() => createNew("upd")}>
            <Icon name="Plus" size={14} className="mr-1" /> УПД
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {(["invoice", "act", "upd"] as DocType[]).map((dt) => {
          const tpls = s.templates.filter((t) => t.docType === dt);
          if (tpls.length === 0) return null;
          return (
            <div key={dt}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{DOC_LABELS[dt]}</h3>
              <div className="space-y-1">
                {tpls.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => openEdit(tpl)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name="FileCog" size={18} className="text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{tpl.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {tpl.font}, {tpl.fontSize}px
                          {tpl.showLogo && " · Логотип"}
                          {tpl.showBankBlock && " · Банк"}
                          {tpl.showQR && " · QR"}
                          {tpl.showSignatures && " · Подписи"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); s.deleteTemplate(tpl.id); }}
                    >
                      <Icon name="Trash2" size={14} className="text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {s.templates.length === 0 && (
        <div className="text-center text-muted-foreground py-8">Нет шаблонов</div>
      )}
    </div>
  );
}
