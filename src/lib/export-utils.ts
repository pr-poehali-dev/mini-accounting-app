import { Invoice, Act, UPD, Company, Product, DocLine } from "./types";
import { formatMoney, formatDate, calcLineTotal, calcLineVat, calcLineTotalWithoutVat } from "./format";
import qrcode from "qrcode-generator";
import * as XLSX from "xlsx";

export function getDocData(lines: DocLine[], companies: Company[], products: Product[], sellerId: string, buyerId: string) {
  const seller = companies.find((c) => c.id === sellerId);
  const buyer = companies.find((c) => c.id === buyerId);

  const rows = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    return {
      name: product?.name || "—",
      unit: product?.unit || "шт",
      quantity: line.quantity,
      price: line.price,
      vat: line.vat,
      total: calcLineTotal(line.price, line.quantity),
      vatAmount: calcLineVat(line.price, line.quantity, line.vat),
      totalWithoutVat: calcLineTotalWithoutVat(line.price, line.quantity, line.vat),
    };
  });

  const grandTotal = rows.reduce((s, l) => s + l.total, 0);
  const grandVat = rows.reduce((s, l) => s + l.vatAmount, 0);
  const grandWithoutVat = grandTotal - grandVat;

  return { seller, buyer, rows, grandTotal, grandVat, grandWithoutVat };
}

export function generateQRString(invoice: Invoice, companies: Company[]): string {
  const seller = companies.find((c) => c.id === invoice.sellerId);
  if (!seller) return "";
  const total = invoice.lines.reduce((s, l) => s + calcLineTotal(l.price, l.quantity), 0);
  const parts = [
    "ST00012",
    `Name=${seller.name}`,
    `PersonalAcc=${seller.rs}`,
    `BankName=${seller.bank}`,
    `BIC=${seller.bik}`,
    `CorrespAcc=${seller.ks}`,
    `PayeeINN=${seller.inn}`,
    seller.kpp ? `KPP=${seller.kpp}` : "",
    `Sum=${total}`,
    `Purpose=Оплата по счету №${invoice.number} от ${formatDate(invoice.date)}`,
  ].filter(Boolean);
  return parts.join("|");
}

export function generateQRDataUrl(text: string): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createDataURL(4, 0);
}

export function exportInvoiceExcel(invoice: Invoice, companies: Company[], products: Product[]) {
  const { seller, buyer, rows, grandTotal, grandVat, grandWithoutVat } = getDocData(invoice.lines, companies, products, invoice.sellerId, invoice.buyerId);
  const cur = invoice.currency;

  const data = [
    [`Счет на оплату №${invoice.number} от ${formatDate(invoice.date)}`],
    [],
    ["Продавец:", seller?.name || ""],
    ["ИНН:", seller?.inn || "", "КПП:", seller?.kpp || ""],
    ["Банк:", seller?.bank || "", "БИК:", seller?.bik || ""],
    ["Р/с:", seller?.rs || "", "К/с:", seller?.ks || ""],
    [],
    ["Покупатель:", buyer?.name || ""],
    ["ИНН:", buyer?.inn || "", "КПП:", buyer?.kpp || ""],
    [],
    ["№", "Наименование", "Ед.", "Кол-во", "Цена", "Сумма без НДС", "НДС", "Сумма НДС", "Всего"],
    ...rows.map((l, i) => [
      i + 1, l.name, l.unit, l.quantity,
      formatMoney(l.price, cur), formatMoney(l.totalWithoutVat, cur),
      `${l.vat}%`, formatMoney(l.vatAmount, cur), formatMoney(l.total, cur),
    ]),
    [],
    ["", "", "", "", "", "", "", "Итого без НДС:", formatMoney(grandWithoutVat, cur)],
    ["", "", "", "", "", "", "", "НДС:", formatMoney(grandVat, cur)],
    ["", "", "", "", "", "", "", "Всего:", formatMoney(grandTotal, cur)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 6 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 6 }, { wch: 14 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Счет");
  XLSX.writeFile(wb, `Счет_${invoice.number}.xlsx`);
}

export function exportActExcel(act: Act, companies: Company[], products: Product[]) {
  const { seller, buyer, rows, grandTotal, grandVat } = getDocData(act.lines, companies, products, act.sellerId, act.buyerId);
  const cur = act.currency;

  const data = [
    [`Акт №${act.number} от ${formatDate(act.date)}`],
    ...(act.contractNumber ? [[`К договору №${act.contractNumber} от ${act.contractDate ? formatDate(act.contractDate) : "___"}`]] : []),
    [],
    ["Исполнитель:", seller?.name || ""],
    ["Заказчик:", buyer?.name || ""],
    [],
    ["№", "Наименование", "Ед.", "Кол-во", "Цена", "Сумма"],
    ...rows.map((l, i) => [i + 1, l.name, l.unit, l.quantity, formatMoney(l.price, cur), formatMoney(l.total, cur)]),
    [],
    ["", "", "", "", "НДС:", formatMoney(grandVat, cur)],
    ["", "", "", "", "Итого:", formatMoney(grandTotal, cur)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 5 }, { wch: 35 }, { wch: 6 }, { wch: 8 }, { wch: 15 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Акт");
  XLSX.writeFile(wb, `Акт_${act.number}.xlsx`);
}

export function exportUpdExcel(upd: UPD, companies: Company[], products: Product[]) {
  const { seller, buyer, rows, grandTotal, grandVat, grandWithoutVat } = getDocData(upd.lines, companies, products, upd.sellerId, upd.buyerId);
  const cur = upd.currency;

  const data = [
    [`УПД №${upd.number} от ${formatDate(upd.date)}`],
    [`Статус: ${upd.status}`],
    [],
    ["Продавец:", seller?.name || ""],
    ["Покупатель:", buyer?.name || ""],
    [],
    ["№", "Наименование", "Ед.", "Кол-во", "Цена", "Без НДС", "НДС%", "Сумма НДС", "С НДС"],
    ...rows.map((l, i) => [
      i + 1, l.name, l.unit, l.quantity,
      formatMoney(l.price, cur), formatMoney(l.totalWithoutVat, cur),
      `${l.vat}%`, formatMoney(l.vatAmount, cur), formatMoney(l.total, cur),
    ]),
    [],
    ["", "", "", "", "", "", "", "Без НДС:", formatMoney(grandWithoutVat, cur)],
    ["", "", "", "", "", "", "", "НДС:", formatMoney(grandVat, cur)],
    ["", "", "", "", "", "", "", "Итого:", formatMoney(grandTotal, cur)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 6 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 6 }, { wch: 14 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "УПД");
  XLSX.writeFile(wb, `УПД_${upd.number}.xlsx`);
}

function docToXML(type: string, number: string, date: string, seller: Company | undefined, buyer: Company | undefined, rows: { name: string; quantity: number; price: number; vat: number; vatAmount: number; total: number }[], grandTotal: number, grandVat: number, currency: string, extra: string = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<${type}>
  <Number>${number}</Number>
  <Date>${date}</Date>
  <Currency>${currency}</Currency>
  ${extra}
  <Seller>
    <Name>${seller?.name || ""}</Name>
    <INN>${seller?.inn || ""}</INN>
    <KPP>${seller?.kpp || ""}</KPP>
    <Bank>${seller?.bank || ""}</Bank>
    <BIK>${seller?.bik || ""}</BIK>
    <RS>${seller?.rs || ""}</RS>
    <KS>${seller?.ks || ""}</KS>
  </Seller>
  <Buyer>
    <Name>${buyer?.name || ""}</Name>
    <INN>${buyer?.inn || ""}</INN>
    <KPP>${buyer?.kpp || ""}</KPP>
  </Buyer>
  <Lines>
${rows.map((l, i) => `    <Line>
      <Number>${i + 1}</Number>
      <Name>${l.name}</Name>
      <Quantity>${l.quantity}</Quantity>
      <Price>${l.price}</Price>
      <VAT>${l.vat}</VAT>
      <VATAmount>${l.vatAmount}</VATAmount>
      <Total>${l.total}</Total>
    </Line>`).join("\n")}
  </Lines>
  <Total>${grandTotal}</Total>
  <TotalVAT>${grandVat}</TotalVAT>
</${type}>`;
}

function downloadXML(xml: string, filename: string) {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportInvoiceXML(invoice: Invoice, companies: Company[], products: Product[]) {
  const { seller, buyer, rows, grandTotal, grandVat } = getDocData(invoice.lines, companies, products, invoice.sellerId, invoice.buyerId);
  const xml = docToXML("Invoice", invoice.number, invoice.date, seller, buyer, rows, grandTotal, grandVat, invoice.currency);
  downloadXML(xml, `Счет_${invoice.number}.xml`);
}

export function exportActXML(act: Act, companies: Company[], products: Product[]) {
  const { seller, buyer, rows, grandTotal, grandVat } = getDocData(act.lines, companies, products, act.sellerId, act.buyerId);
  const extra = act.contractNumber ? `<ContractNumber>${act.contractNumber}</ContractNumber>\n  <ContractDate>${act.contractDate}</ContractDate>` : "";
  const xml = docToXML("Act", act.number, act.date, seller, buyer, rows, grandTotal, grandVat, act.currency, extra);
  downloadXML(xml, `Акт_${act.number}.xml`);
}

export function exportUpdXML(upd: UPD, companies: Company[], products: Product[]) {
  const { seller, buyer, rows, grandTotal, grandVat } = getDocData(upd.lines, companies, products, upd.sellerId, upd.buyerId);
  const extra = `<Status>${upd.status}</Status>`;
  const xml = docToXML("UPD", upd.number, upd.date, seller, buyer, rows, grandTotal, grandVat, upd.currency, extra);
  downloadXML(xml, `УПД_${upd.number}.xml`);
}

export { getDocData as getInvoiceData };
