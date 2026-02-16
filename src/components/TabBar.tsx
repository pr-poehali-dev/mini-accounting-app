import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, string> = {
  companies: "Building2",
  products: "Package",
  invoices: "Receipt",
  "company-edit": "Building2",
  "product-edit": "Package",
  "invoice-edit": "Receipt",
};

export default function TabBar() {
  const s = useStore();

  if (s.tabs.length === 0) return null;

  return (
    <div className="flex items-center border-b bg-muted/30 overflow-x-auto">
      {s.tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer border-r border-border whitespace-nowrap transition-colors group",
            s.activeTabId === tab.id
              ? "bg-background text-foreground border-b-2 border-b-primary"
              : "text-muted-foreground hover:bg-background/50"
          )}
          onClick={() => s.setActiveTab(tab.id)}
        >
          <Icon name={TYPE_ICONS[tab.type] || "File"} size={14} />
          <span className="max-w-32 truncate">{tab.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              s.closeTab(tab.id);
            }}
            className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
          >
            <Icon name="X" size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
