import { useSyncExternalStore } from "react";
import { store } from "@/lib/store";

export function useStore() {
  useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => JSON.stringify({
      companies: store.companies,
      products: store.products,
      invoices: store.invoices,
      acts: store.acts,
      upds: store.upds,
      templates: store.templates,
      tabs: store.tabs,
      activeTabId: store.activeTabId,
    })
  );

  return store;
}