import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { TabItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TreeSection {
  label: string;
  icon: string;
  children: { label: string; icon: string; tab: TabItem }[];
}

const TREE: TreeSection[] = [
  {
    label: "Справочники",
    icon: "BookOpen",
    children: [
      { label: "Фирмы", icon: "Building2", tab: { id: "companies", type: "companies", title: "Фирмы" } },
      { label: "Товары", icon: "Package", tab: { id: "products", type: "products", title: "Товары" } },
    ],
  },
  {
    label: "Документы",
    icon: "FileText",
    children: [
      { label: "Счета", icon: "Receipt", tab: { id: "invoices", type: "invoices", title: "Счета" } },
      { label: "Акты", icon: "FileCheck", tab: { id: "acts", type: "acts", title: "Акты" } },
      { label: "УПД", icon: "FileBadge", tab: { id: "upds", type: "upds", title: "УПД" } },
    ],
  },
];

export default function TreePanel() {
  const s = useStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Справочники: true, Документы: true });

  const toggle = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="w-56 min-w-56 bg-sidebar border-r border-sidebar-border flex flex-col select-none">
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Icon name="Calculator" size={18} className="text-sidebar-primary" />
          <span className="font-semibold text-sm text-sidebar-foreground">Бухгалтерия</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        {TREE.map((section) => (
          <div key={section.label}>
            <button
              onClick={() => toggle(section.label)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Icon name={expanded[section.label] ? "ChevronDown" : "ChevronRight"} size={12} />
              <Icon name={section.icon} size={14} />
              {section.label}
            </button>
            {expanded[section.label] && (
              <div className="ml-3">
                {section.children.map((item) => (
                  <button
                    key={item.tab.id}
                    onClick={() => s.openTab(item.tab)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-colors rounded-md mx-1",
                      s.activeTabId === item.tab.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Icon name={item.icon} size={14} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
