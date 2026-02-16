import TreePanel from "@/components/TreePanel";
import TabBar from "@/components/TabBar";
import TabContent from "@/components/TabContent";
import { useStore } from "@/hooks/useStore";
import Icon from "@/components/ui/icon";

const Index = () => {
  const s = useStore();
  const activeTab = s.tabs.find((t) => t.id === s.activeTabId);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        <TreePanel />
        <div className="flex-1 flex flex-col min-w-0">
          <TabBar />
          <div className="flex-1 overflow-auto">
            {activeTab ? (
              <TabContent tab={activeTab} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Icon name="Calculator" size={48} className="mb-4 opacity-30" />
                <p className="text-lg">Мини-бухгалтерия</p>
                <p className="text-sm mt-1">Выберите раздел в дереве слева</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
