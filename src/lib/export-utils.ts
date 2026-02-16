import { Invoice, Company, Product } from "./types";
import { formatMoney, formatDate, calcLineTotal, calcLineVat, calcLineTotalWithoutVat } from "./format";
import qrcode from "qrcode-generator";
import * as XLSX from "xlsx";

function getInvoiceData(invoice: Invoice, companies: Company[], products: Product[]) {
  const seller = companies.find((c) => c.id === invoice.sellerId);
  const buyer = companies.find((c) => c.id === invoice.buyerId);

  const lines = invoice.lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    return {
      name: product?.name || "—",
      quantity: line.quantity,
      price: line.price,
      vat: line.vat,
      total: calcLineTotal(line.price, line.quantity),
      vatAmount: calcLineVat(line.price, line.quantity, line.vat),
      totalWithoutVat: calcLineTotalWithoutVat(line.price, line.quantity, line.vat),
    };
  });

  const grandTotal = lines.reduce((s, l) => s + l.total, 0);
  const grandVat = lines.reduce((s, l) => s + l.vatAmount, 0);
  const grandWithoutVat = grandTotal - grandVat;

  return { seller, buyer, lines, grandTotal, grandVat, grandWithoutVat };
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

export function exportExcel(invoice: Invoice, companies: Company[], products: Product[]) {
  const { seller, buyer, lines, grandTotal, grandVat, grandWithoutVat } = getInvoiceData(invoice, companies, products);

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
    ["№", "Наименование", "Кол-во", "Цена", "Ставка НДС", "Сумма НДС", "Сумма"],
    ...lines.map((l, i) => [
      i + 1,
      l.name,
      l.quantity,
      formatMoney(l.price, invoice.currency),
      `${l.vat}%`,
      formatMoney(l.vatAmount, invoice.currency),
      formatMoney(l.total, invoice.currency),
    ]),
    [],
    ["", "", "", "", "Итого без НДС:", "", formatMoney(grandWithoutVat, invoice.currency)],
    ["", "", "", "", "НДС:", "", formatMoney(grandVat, invoice.currency)],
    ["", "", "", "", "Итого:", "", formatMoney(grandTotal, invoice.currency)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Счет");
  XLSX.writeFile(wb, `Счет_${invoice.number}.xlsx`);
}

export function exportXML(invoice: Invoice, companies: Company[], products: Product[]) {
  const { seller, buyer, lines, grandTotal, grandVat } = getInvoiceData(invoice, companies, products);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <Number>${invoice.number}</Number>
  <Date>${invoice.date}</Date>
  <Currency>${invoice.currency}</Currency>
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
${lines.map((l, i) => `    <Line>
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
</Invoice>`;

  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Счет_${invoice.number}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generatePrintHTML(invoice: Invoice, companies: Company[], products: Product[]): string {
  const { seller, buyer, lines, grandTotal, grandVat, grandWithoutVat } = getInvoiceData(invoice, companies, products);
  const qrString = generateQRString(invoice, companies);
  const qrUrl = qrString ? generateQRDataUrl(qrString) : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Счет №${invoice.number}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #000; }
  h2 { font-size: 16px; margin: 20px 0 10px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #000; padding: 4px 8px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  .right { text-align: right; }
  .bank-header { background: #000; color: #fff; padding: 4px 8px; font-weight: bold; }
  .totals td { border: none; font-weight: 600; }
  .qr { margin-top: 20px; }
  .qr img { width: 150px; height: 150px; }
  .sign-line { border-bottom: 1px solid #000; display: inline-block; width: 200px; margin: 0 10px; }
  @media print { body { margin: 0; } }
</style></head><body>
<table style="border:2px solid #000;">
  <tr><td style="border:none;width:50%">
    <div class="bank-header">${seller?.bank || ""}</div>
    <div>БИК: ${seller?.bik || ""}</div>
    <div>К/с: ${seller?.ks || ""}</div>
  </td><td style="border:none;">
    <div>Сч. №</div>
    <div><b>${seller?.rs || ""}</b></div>
  </td></tr>
</table>

<h2>Счет на оплату №${invoice.number} от ${formatDate(invoice.date)}</h2>

<p><b>Поставщик:</b> ${seller?.name || ""}, ИНН ${seller?.inn || ""}${seller?.kpp ? ", КПП " + seller.kpp : ""}, ${seller?.address || ""}</p>
<p><b>Покупатель:</b> ${buyer?.name || ""}, ИНН ${buyer?.inn || ""}${buyer?.kpp ? ", КПП " + buyer.kpp : ""}, ${buyer?.address || ""}</p>

<table>
  <thead>
    <tr>
      <th>№</th><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>НДС</th><th>Сумма НДС</th><th>Сумма</th>
    </tr>
  </thead>
  <tbody>
    ${lines.map((l, i) => `<tr>
      <td>${i + 1}</td><td>${l.name}</td><td class="right">${l.quantity}</td>
      <td class="right">${formatMoney(l.price, invoice.currency)}</td>
      <td class="right">${l.vat}%</td>
      <td class="right">${formatMoney(l.vatAmount, invoice.currency)}</td>
      <td class="right">${formatMoney(l.total, invoice.currency)}</td>
    </tr>`).join("")}
  </tbody>
</table>

<table class="totals">
  <tr><td></td><td></td><td></td><td></td><td class="right">Итого без НДС:</td><td class="right">${formatMoney(grandWithoutVat, invoice.currency)}</td></tr>
  <tr><td></td><td></td><td></td><td></td><td class="right">НДС:</td><td class="right">${formatMoney(grandVat, invoice.currency)}</td></tr>
  <tr><td></td><td></td><td></td><td></td><td class="right"><b>Итого:</b></td><td class="right"><b>${formatMoney(grandTotal, invoice.currency)}</b></td></tr>
</table>

<br/>
<p>Руководитель <span class="sign-line"></span> / <span class="sign-line"></span></p>
<p>Бухгалтер <span class="sign-line"></span> / <span class="sign-line"></span></p>

${qrUrl ? `<div class="qr"><p>QR-код для оплаты:</p><img src="${qrUrl}" /></div>` : ""}
</body></html>`;
}
