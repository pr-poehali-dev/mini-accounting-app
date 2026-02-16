import { TemplateSettings, Company, Product, Invoice, Act, UPD, DocType } from "./types";
import { formatMoney, formatDate, calcLineTotal, calcLineVat, calcLineTotalWithoutVat } from "./format";
import { generateQRString, generateQRDataUrl } from "./export-utils";

function getCss(tpl: TemplateSettings): string {
  return `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: '${tpl.font}', serif; font-size: ${tpl.fontSize}px; color: #000; padding: ${tpl.pageMargin}mm; line-height: 1.3; }
  table { width: 100%; border-collapse: collapse; }
  .bordered td, .bordered th { border: 1px solid #000; padding: 3px 5px; font-size: ${tpl.fontSize - 1}px; }
  .bordered th { background: ${tpl.tableHeaderBg}; font-weight: bold; text-align: center; font-size: ${tpl.fontSize - 2}px; }
  .right { text-align: right; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .title { font-size: ${tpl.titleFontSize}px; font-weight: bold; text-align: center; margin: 8px 0; }
  .subtitle { font-size: ${tpl.fontSize}px; text-align: center; margin-bottom: 10px; }
  .bank-block { margin-bottom: 10px; }
  .bank-block td { padding: 2px 5px; font-size: ${tpl.fontSize - 1}px; vertical-align: top; }
  .bank-block .header-cell { font-size: ${tpl.fontSize - 3}px; color: #666; }
  .sign-block { margin-top: 20px; }
  .sign-block td { padding: 4px 0; border: none; vertical-align: bottom; }
  .sign-line { border-bottom: 1px solid #000; min-width: 150px; display: inline-block; }
  .small { font-size: ${tpl.fontSize - 3}px; color: #666; }
  .qr-block { margin-top: 15px; display: flex; align-items: flex-start; gap: 10px; }
  .qr-block img { width: 120px; height: 120px; }
  hr.thick { border: none; border-top: 2px solid #000; margin: 2px 0; }
  hr.thin { border: none; border-top: 1px solid #000; margin: 1px 0; }
  .totals-row td { border: none !important; padding: 2px 5px; font-size: ${tpl.fontSize - 1}px; }
  .logo { max-height: 50px; margin-bottom: 5px; }
  .header-text { font-size: ${tpl.fontSize - 1}px; color: #333; margin-bottom: 8px; white-space: pre-line; }
  .footer-text { font-size: ${tpl.fontSize - 2}px; color: #666; margin-top: 15px; border-top: 1px solid #ccc; padding-top: 8px; white-space: pre-line; }
  @media print { body { padding: 5mm; } }
  @page { size: A4; margin: 10mm; }
  `;
}

function amountInWords(kopecks: number): string {
  const rub = Math.floor(kopecks / 100);
  const kop = kopecks % 100;
  const units = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
  const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
  const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];
  function chunk(n: number): string {
    if (n === 0) return "";
    const h = Math.floor(n / 100); const t = Math.floor((n % 100) / 10); const u = n % 10;
    let res = "";
    if (h > 0) res += hundreds[h] + " ";
    if (t === 1) { res += teens[u] + " "; return res.trim(); }
    if (t > 1) res += tens[t] + " ";
    if (u > 0) res += units[u] + " ";
    return res.trim();
  }
  function rubWord(n: number): string { const r = n % 100; if (r >= 11 && r <= 19) return "рублей"; const l = r % 10; if (l === 1) return "рубль"; if (l >= 2 && l <= 4) return "рубля"; return "рублей"; }
  function kopWord(n: number): string { const r = n % 100; if (r >= 11 && r <= 19) return "копеек"; const l = r % 10; if (l === 1) return "копейка"; if (l >= 2 && l <= 4) return "копейки"; return "копеек"; }
  if (rub === 0) return `Ноль ${rubWord(0)} ${String(kop).padStart(2, "0")} ${kopWord(kop)}`;
  const thousands = Math.floor(rub / 1000); const remainder = rub % 1000;
  let result = "";
  if (thousands > 0) {
    let tChunk = chunk(thousands); tChunk = tChunk.replace("один ", "одна ").replace("два ", "две ");
    const tMod = thousands % 100; let tw = "тысяч";
    if (tMod >= 11 && tMod <= 19) tw = "тысяч";
    else { const tl = tMod % 10; if (tl === 1) tw = "тысяча"; else if (tl >= 2 && tl <= 4) tw = "тысячи"; }
    result += tChunk + " " + tw + " ";
  }
  if (remainder > 0) result += chunk(remainder) + " ";
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return `${result.trim()} ${rubWord(rub)} ${String(kop).padStart(2, "0")} ${kopWord(kop)}`;
}

interface RowData { name: string; unit: string; quantity: number; price: number; vat: number; total: number; vatAmount: number; totalWithoutVat: number; }

function getDemoRows(): RowData[] {
  return [
    { name: "Консультация (1 час)", unit: "час", quantity: 2, price: 500000, vat: 20, total: 1000000, vatAmount: 166667, totalWithoutVat: 833333 },
    { name: "Разработка сайта", unit: "шт", quantity: 1, price: 15000000, vat: 20, total: 15000000, vatAmount: 2500000, totalWithoutVat: 12500000 },
  ];
}

function getDemoSeller(companies: Company[]): Company {
  return companies.find((c) => c.role === "seller") || {
    id: "demo", name: 'ООО "Ромашка"', inn: "7707123456", kpp: "770701001",
    bank: "ПАО Сбербанк", bik: "044525225", rs: "40702810938000012345",
    ks: "30101810400000000225", address: "г. Москва, ул. Ленина, д. 1",
    role: "seller", director: "Петров А.В.", accountant: "Сидорова Е.Н.",
  };
}

function getDemoBuyer(companies: Company[]): Company {
  return companies.find((c) => c.role === "buyer") || {
    id: "demo2", name: "ИП Иванов И.И.", inn: "771234567890", kpp: "",
    bank: "АО Тинькофф Банк", bik: "044525974", rs: "40802810100000012345",
    ks: "30101810145250000974", address: "г. Москва, ул. Пушкина, д. 5",
    role: "buyer", director: "Иванов И.И.", accountant: "",
  };
}

function renderInvoice(tpl: TemplateSettings, seller: Company, buyer: Company, rows: RowData[]): string {
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const grandVat = rows.reduce((s, r) => s + r.vatAmount, 0);
  const grandWithoutVat = grandTotal - grandVat;

  let html = "";

  if (tpl.showLogo && tpl.logoUrl) html += `<img src="${tpl.logoUrl}" class="logo"/>`;
  if (tpl.headerText) html += `<div class="header-text">${tpl.headerText}</div>`;

  if (tpl.showBankBlock) {
    html += `<table class="bank-block" style="border:2px solid #000;">
      <tr><td style="width:55%;border-right:2px solid #000;border-bottom:1px solid #000;" rowspan="2"><div class="header-cell">Банк получателя</div><div class="bold">${seller.bank}</div></td>
      <td style="border-bottom:1px solid #000;"><div class="header-cell">БИК</div><div>${seller.bik}</div></td></tr>
      <tr><td><div class="header-cell">Сч. №</div><div>${seller.ks}</div></td></tr>
      <tr><td style="border-right:2px solid #000;border-top:2px solid #000;"><div class="header-cell">Получатель</div><div class="bold">${seller.name}</div><div>ИНН ${seller.inn}${seller.kpp ? " КПП " + seller.kpp : ""}</div></td>
      <td style="border-top:2px solid #000;"><div class="header-cell">Сч. №</div><div class="bold">${seller.rs}</div></td></tr></table>`;
  }

  html += `<div class="title">Счет на оплату № 0001 от ${formatDate(new Date().toISOString().slice(0, 10))}</div>`;
  html += `<hr class="thick"/><hr class="thin"/>`;
  html += `<table style="margin:8px 0;"><tr><td style="width:100px;" class="bold">Поставщик:</td><td>${seller.name}, ИНН ${seller.inn}${seller.kpp ? ", КПП " + seller.kpp : ""}, ${seller.address}</td></tr>
    <tr><td class="bold">Покупатель:</td><td>${buyer.name}, ИНН ${buyer.inn}${buyer.kpp ? ", КПП " + buyer.kpp : ""}, ${buyer.address}</td></tr></table>`;

  html += `<table class="bordered"><thead><tr>`;
  if (tpl.showItemNumbers) html += `<th style="width:30px;">№</th>`;
  html += `<th>Наименование</th><th style="width:40px;">Ед.</th><th style="width:45px;">Кол-во</th><th style="width:75px;">Цена</th><th style="width:80px;">Сумма</th><th style="width:40px;">НДС</th><th style="width:75px;">Сумма НДС</th><th style="width:85px;">Всего</th></tr></thead><tbody>`;
  rows.forEach((r, i) => {
    html += `<tr>`;
    if (tpl.showItemNumbers) html += `<td class="center">${i + 1}</td>`;
    html += `<td>${r.name}</td><td class="center">${r.unit}</td><td class="right">${r.quantity}</td><td class="right">${formatMoney(r.price, "RUB")}</td><td class="right">${formatMoney(r.totalWithoutVat, "RUB")}</td><td class="center">${r.vat}%</td><td class="right">${formatMoney(r.vatAmount, "RUB")}</td><td class="right">${formatMoney(r.total, "RUB")}</td></tr>`;
  });
  html += `</tbody></table>`;
  html += `<table><tr class="totals-row"><td colspan="7"></td><td class="right bold" style="width:160px;">Итого:</td><td class="right bold" style="width:85px;">${formatMoney(grandWithoutVat, "RUB")}</td></tr>
    <tr class="totals-row"><td colspan="7"></td><td class="right bold">В том числе НДС:</td><td class="right bold">${formatMoney(grandVat, "RUB")}</td></tr>
    <tr class="totals-row"><td colspan="7"></td><td class="right bold">Всего к оплате:</td><td class="right bold">${formatMoney(grandTotal, "RUB")}</td></tr></table>`;

  html += `<p style="margin:10px 0;">Всего наименований ${rows.length}, на сумму ${formatMoney(grandTotal, "RUB")}</p>`;
  if (tpl.showAmountWords) html += `<p style="margin-bottom:15px;font-weight:bold;">${amountInWords(grandTotal)}</p>`;

  if (tpl.showSignatures) {
    html += `<hr class="thin"/><table class="sign-block" style="width:100%;"><tr>
      <td style="width:50%;"><span class="bold">Руководитель</span> <span class="sign-line"></span> / ${seller.director || "___"} /</td>
      <td><span class="bold">Бухгалтер</span> <span class="sign-line"></span> / ${seller.accountant || "___"} /</td></tr></table>`;
  }
  if (tpl.showStamp && tpl.showSignatures) html += `<p style="margin-top:10px;">М.П.</p>`;

  if (tpl.showQR) {
    const demoInvoice: Invoice = { id: "demo", number: "0001", date: new Date().toISOString().slice(0, 10), sellerId: seller.id, buyerId: buyer.id, lines: rows.map((r, i) => ({ id: String(i), productId: "", quantity: r.quantity, price: r.price, vat: r.vat })), currency: "RUB" };
    const qrStr = generateQRString(demoInvoice, [seller, buyer]);
    if (qrStr) {
      const qrUrl = generateQRDataUrl(qrStr);
      html += `<div class="qr-block"><img src="${qrUrl}"/><div><p class="bold">QR-код для оплаты</p><p>Сумма: ${formatMoney(grandTotal, "RUB")}</p></div></div>`;
    }
  }

  if (tpl.footerText) html += `<div class="footer-text">${tpl.footerText}</div>`;
  return html;
}

function renderAct(tpl: TemplateSettings, seller: Company, buyer: Company, rows: RowData[]): string {
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const grandVat = rows.reduce((s, r) => s + r.vatAmount, 0);

  let html = "";
  if (tpl.showLogo && tpl.logoUrl) html += `<img src="${tpl.logoUrl}" class="logo"/>`;
  if (tpl.headerText) html += `<div class="header-text">${tpl.headerText}</div>`;

  html += `<div class="title">Акт № 0001 от ${formatDate(new Date().toISOString().slice(0, 10))}</div>`;
  html += `<hr class="thick"/><hr class="thin"/>`;
  html += `<table style="margin:8px 0;"><tr><td style="width:100px;" class="bold">Исполнитель:</td><td>${seller.name}, ИНН ${seller.inn}, ${seller.address}</td></tr>
    <tr><td class="bold">Заказчик:</td><td>${buyer.name}, ИНН ${buyer.inn}, ${buyer.address}</td></tr></table>`;
  html += `<p style="margin:8px 0;">Мы, нижеподписавшиеся, составили настоящий Акт о выполнении работ:</p>`;

  html += `<table class="bordered"><thead><tr>`;
  if (tpl.showItemNumbers) html += `<th style="width:30px;">№</th>`;
  html += `<th>Наименование</th><th style="width:40px;">Ед.</th><th style="width:50px;">Кол-во</th><th style="width:80px;">Цена</th><th style="width:90px;">Сумма</th></tr></thead><tbody>`;
  rows.forEach((r, i) => {
    html += `<tr>`;
    if (tpl.showItemNumbers) html += `<td class="center">${i + 1}</td>`;
    html += `<td>${r.name}</td><td class="center">${r.unit}</td><td class="right">${r.quantity}</td><td class="right">${formatMoney(r.price, "RUB")}</td><td class="right">${formatMoney(r.total, "RUB")}</td></tr>`;
  });
  html += `</tbody></table>`;
  html += `<table><tr class="totals-row"><td colspan="4"></td><td class="right bold">НДС:</td><td class="right bold">${formatMoney(grandVat, "RUB")}</td></tr>
    <tr class="totals-row"><td colspan="4"></td><td class="right bold">Всего:</td><td class="right bold">${formatMoney(grandTotal, "RUB")}</td></tr></table>`;

  if (tpl.showAmountWords) html += `<p style="margin:10px 0;font-weight:bold;">${amountInWords(grandTotal)}</p>`;
  html += `<p style="margin:5px 0;">Работы выполнены полностью и в срок. Претензий нет.</p>`;

  if (tpl.showSignatures) {
    html += `<hr class="thin" style="margin-top:15px;"/><table class="sign-block" style="width:100%;"><tr>
      <td style="width:50%;padding-right:20px;"><p class="bold" style="margin-bottom:20px;">Исполнитель:</p><p>${seller.name}</p><br/><p><span class="sign-line"></span> / ${seller.director || "___"} /</p>${tpl.showStamp ? "<p style='margin-top:10px;'>М.П.</p>" : ""}</td>
      <td style="padding-left:20px;"><p class="bold" style="margin-bottom:20px;">Заказчик:</p><p>${buyer.name}</p><br/><p><span class="sign-line"></span> / ${buyer.director || "___"} /</p>${tpl.showStamp ? "<p style='margin-top:10px;'>М.П.</p>" : ""}</td></tr></table>`;
  }

  if (tpl.footerText) html += `<div class="footer-text">${tpl.footerText}</div>`;
  return html;
}

function renderUpd(tpl: TemplateSettings, seller: Company, buyer: Company, rows: RowData[]): string {
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const grandVat = rows.reduce((s, r) => s + r.vatAmount, 0);
  const grandWithoutVat = grandTotal - grandVat;

  let html = "";
  if (tpl.showLogo && tpl.logoUrl) html += `<img src="${tpl.logoUrl}" class="logo"/>`;
  if (tpl.headerText) html += `<div class="header-text">${tpl.headerText}</div>`;

  html += `<div style="text-align:right;font-size:${tpl.fontSize - 1}px;margin-bottom:5px;">Статус: <b>1</b> — Счет-фактура и передаточный документ</div>`;
  html += `<div class="title" style="font-size:${tpl.titleFontSize - 2}px;">Универсальный передаточный документ</div>`;
  html += `<table style="margin-bottom:5px;"><tr><td class="bold" style="width:200px;">Счёт-фактура №</td><td>0001 от ${formatDate(new Date().toISOString().slice(0, 10))}</td></tr></table>`;
  html += `<hr class="thick"/>`;
  html += `<table style="margin:5px 0;font-size:${tpl.fontSize - 1}px;">
    <tr><td class="bold" style="width:130px;">Продавец (1):</td><td>${seller.name}</td></tr>
    <tr><td class="bold">Адрес (2):</td><td>${seller.address}</td></tr>
    <tr><td class="bold">ИНН/КПП (2б):</td><td>${seller.inn}${seller.kpp ? " / " + seller.kpp : ""}</td></tr>
    <tr><td class="bold">Покупатель (6):</td><td>${buyer.name}</td></tr>
    <tr><td class="bold">ИНН/КПП (6б):</td><td>${buyer.inn}${buyer.kpp ? " / " + buyer.kpp : ""}</td></tr></table>`;

  html += `<table class="bordered"><thead><tr>`;
  if (tpl.showItemNumbers) html += `<th style="width:25px;">№</th>`;
  html += `<th>Наименование (1а)</th><th style="width:35px;">Ед.</th><th style="width:40px;">Кол-во</th><th style="width:70px;">Цена</th><th style="width:75px;">Без НДС</th><th style="width:35px;">НДС</th><th style="width:70px;">Сумма НДС</th><th style="width:80px;">С НДС</th></tr></thead><tbody>`;
  rows.forEach((r, i) => {
    html += `<tr>`;
    if (tpl.showItemNumbers) html += `<td class="center">${i + 1}</td>`;
    html += `<td>${r.name}</td><td class="center">${r.unit}</td><td class="right">${r.quantity}</td><td class="right">${formatMoney(r.price, "RUB")}</td><td class="right">${formatMoney(r.totalWithoutVat, "RUB")}</td><td class="center">${r.vat}%</td><td class="right">${formatMoney(r.vatAmount, "RUB")}</td><td class="right">${formatMoney(r.total, "RUB")}</td></tr>`;
  });
  html += `<tr class="bold"><td colspan="${tpl.showItemNumbers ? 5 : 4}" class="right">Всего:</td><td class="right">${formatMoney(grandWithoutVat, "RUB")}</td><td class="center">X</td><td class="right">${formatMoney(grandVat, "RUB")}</td><td class="right">${formatMoney(grandTotal, "RUB")}</td></tr></tbody></table>`;

  if (tpl.showAmountWords) html += `<p style="margin:10px 0;font-weight:bold;">${amountInWords(grandTotal)}</p>`;

  if (tpl.showSignatures) {
    html += `<hr class="thick" style="margin-top:10px;"/><div style="text-align:center;margin:5px 0;font-weight:bold;">[ II. Передаточный документ ]</div>`;
    html += `<table class="sign-block" style="width:100%;"><tr>
      <td style="width:50%;"><p class="bold" style="margin-bottom:8px;">Передал:</p><p>${seller.name}</p><br/><p><span class="sign-line"></span> / ${seller.director || "___"} /</p>${tpl.showStamp ? "<p style='margin-top:10px;'>М.П.</p>" : ""}</td>
      <td><p class="bold" style="margin-bottom:8px;">Получил:</p><p>${buyer.name}</p><br/><p><span class="sign-line"></span> / ${buyer.director || "___"} /</p>${tpl.showStamp ? "<p style='margin-top:10px;'>М.П.</p>" : ""}</td></tr></table>`;
  }

  if (tpl.footerText) html += `<div class="footer-text">${tpl.footerText}</div>`;
  return html;
}

export function buildPreviewHTML(tpl: TemplateSettings, companies: Company[], _products: Product[]): string {
  const seller = getDemoSeller(companies);
  const buyer = getDemoBuyer(companies);
  const rows = getDemoRows();
  const css = getCss(tpl);

  let body = "";
  switch (tpl.docType) {
    case "invoice": body = renderInvoice(tpl, seller, buyer, rows); break;
    case "act": body = renderAct(tpl, seller, buyer, rows); break;
    case "upd": body = renderUpd(tpl, seller, buyer, rows); break;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;
}

export function renderDocWithTemplate(
  tpl: TemplateSettings,
  doc: Invoice | Act | UPD,
  companies: Company[],
  products: Product[]
): string {
  const seller = companies.find((c) => c.id === doc.sellerId);
  const buyer = companies.find((c) => c.id === doc.buyerId);
  if (!seller || !buyer) return "<p>Не указан продавец или покупатель</p>";

  const rows: RowData[] = doc.lines.map((line) => {
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

  const css = getCss(tpl);
  let body = "";
  switch (tpl.docType) {
    case "invoice": body = renderInvoice(tpl, seller, buyer, rows); break;
    case "act": body = renderAct(tpl, seller, buyer, rows); break;
    case "upd": body = renderUpd(tpl, seller, buyer, rows); break;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tpl.name}</title><style>${css}</style></head><body>${body}</body></html>`;
}
