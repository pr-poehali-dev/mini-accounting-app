import { TabItem } from "@/lib/types";
import CompanyList from "./CompanyList";
import CompanyForm from "./CompanyForm";
import ProductList from "./ProductList";
import ProductForm from "./ProductForm";
import InvoiceList from "./InvoiceList";
import InvoiceForm from "./InvoiceForm";

export default function TabContent({ tab }: { tab: TabItem }) {
  switch (tab.type) {
    case "companies":
      return <CompanyList />;
    case "company-edit":
      return <CompanyForm entityId={tab.entityId} />;
    case "products":
      return <ProductList />;
    case "product-edit":
      return <ProductForm entityId={tab.entityId} />;
    case "invoices":
      return <InvoiceList />;
    case "invoice-edit":
      return <InvoiceForm entityId={tab.entityId} />;
    default:
      return <div className="p-4 text-muted-foreground">Неизвестная форма</div>;
  }
}
