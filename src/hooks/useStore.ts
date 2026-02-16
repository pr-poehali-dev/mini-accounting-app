import { useSyncExternalStore } from "react";
import { store } from "@/lib/store";

export function useStore() {
  useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => JSON.stringify({
      companies: store.companies,
      products: store.products,
      invoices: store.invoices,
      tabs: store.tabs,
      activeTabId: store.activeTabId,
    })
  );

  return store;
}
