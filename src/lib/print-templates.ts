import { Invoice, Act, UPD, Company, Product, Currency } from "./types";
import { formatMoney, formatDate, calcLineTotal, calcLineVat, calcLineTotalWithoutVat } from "./format";
import { generateQRString, generateQRDataUrl } from "./export-utils";

function getDocData(lines: { productId: string; quantity: number; price: number; vat: number }[], companies: Company[], products: Product[], sellerId: string, buyerId: string) {
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

const PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 11px; color: #000; padding: 15mm; line-height: 1.3; }
  table { width: 100%; border-collapse: collapse; }
  .bordered td, .bordered th { border: 1px solid #000; padding: 3px 5px; font-size: 10px; }
  .bordered th { background: #e8e8e8; font-weight: bold; text-align: center; font-size: 9px; }
  .right { text-align: right; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .title { font-size: 14px; font-weight: bold; text-align: center; margin: 8px 0; }
  .subtitle { font-size: 11px; text-align: center; margin-bottom: 10px; }
  .bank-block { margin-bottom: 10px; }
  .bank-block td { padding: 2px 5px; font-size: 10px; vertical-align: top; }
  .bank-block .header-cell { font-size: 8px; color: #666; }
  .sign-block { margin-top: 20px; }
  .sign-block td { padding: 4px 0; border: none; vertical-align: bottom; }
  .sign-line { border-bottom: 1px solid #000; min-width: 150px; display: inline-block; }
  .small { font-size: 8px; color: #666; }
  .qr-block { margin-top: 15px; display: flex; align-items: flex-start; gap: 10px; }
  .qr-block img { width: 120px; height: 120px; }
  hr.thick { border: none; border-top: 2px solid #000; margin: 2px 0; }
  hr.thin { border: none; border-top: 1px solid #000; margin: 1px 0; }
  .totals-row td { border: none !important; padding: 2px 5px; font-size: 10px; }
  @media print { body { padding: 5mm; } }
  @page { size: A4; margin: 10mm; }
`;

function wrapHTML(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${PRINT_CSS}</style></head><body>${body}</body></html>`;
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
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    let res = "";
    if (h > 0) res += hundreds[h] + " ";
    if (t === 1) { res += teens[u] + " "; return res.trim(); }
    if (t > 1) res += tens[t] + " ";
    if (u > 0) res += units[u] + " ";
    return res.trim();
  }

  function rubWord(n: number): string {
    const r = n % 100;
    if (r >= 11 && r <= 19) return "рублей";
    const l = r % 10;
    if (l === 1) return "рубль";
    if (l >= 2 && l <= 4) return "рубля";
    return "рублей";
  }

  function kopWord(n: number): string {
    const r = n % 100;
    if (r >= 11 && r <= 19) return "копеек";
    const l = r % 10;
    if (l === 1) return "копейка";
    if (l >= 2 && l <= 4) return "копейки";
    return "копеек";
  }

  if (rub === 0) return `Ноль ${rubWord(0)} ${String(kop).padStart(2, "0")} ${kopWord(kop)}`;

  const thousands = Math.floor(rub / 1000);
  const remainder = rub % 1000;

  let result = "";
  if (thousands > 0) {
    let tChunk = chunk(thousands);
    tChunk = tChunk.replace("один ", "одна ").replace("два ", "две ");
    const tMod = thousands % 100;
    let tw = "тысяч";
    if (tMod >= 11 && tMod <= 19) tw = "тысяч";
    else { const tl = tMod % 10; if (tl === 1) tw = "тысяча"; else if (tl >= 2 && tl <= 4) tw = "тысячи"; }
    result += tChunk + " " + tw + " ";
  }
  if (remainder > 0) result += chunk(remainder) + " ";

  result = result.charAt(0).toUpperCase() + result.slice(1);
  return `${result.trim()} ${rubWord(rub)} ${String(kop).padStart(2, "0")} ${kopWord(kop)}`;
}

export function printInvoice1C(invoice: Invoice, companies: Company[], products: Product[]): string {
  const { seller, buyer, rows, grandTotal, grandVat, grandWithoutVat } = getDocData(invoice.lines, companies, products, invoice.sellerId, invoice.buyerId);
  const cur = invoice.currency;
  const qrStr = generateQRString(invoice, companies);
  const qrUrl = qrStr ? generateQRDataUrl(qrStr) : "";

  const bankBlock = `
<table class="bank-block" style="border:2px solid #000;">
  <tr>
    <td style="width:55%;border-right:2px solid #000;border-bottom:1px solid #000;" rowspan="2">
      <div class="header-cell">Банк получателя</div>
      <div class="bold">${seller?.bank || ""}</div>
    </td>
    <td style="border-bottom:1px solid #000;">
      <div class="header-cell">БИК</div>
      <div>${seller?.bik || ""}</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="header-cell">Сч. №</div>
      <div>${seller?.ks || ""}</div>
    </td>
  </tr>
  <tr>
    <td style="border-right:2px solid #000;border-top:2px solid #000;">
      <div class="header-cell">Получатель</div>
      <div class="bold">${seller?.name || ""}</div>
      <div>ИНН ${seller?.inn || ""}${seller?.kpp ? " КПП " + seller.kpp : ""}</div>
    </td>
    <td style="border-top:2px solid #000;">
      <div class="header-cell">Сч. №</div>
      <div class="bold">${seller?.rs || ""}</div>
    </td>
  </tr>
</table>`;

  const tableRows = rows.map((r, i) => `
  <tr>
    <td class="center">${i + 1}</td>
    <td>${r.name}</td>
    <td class="center">${r.unit}</td>
    <td class="right">${r.quantity}</td>
    <td class="right">${formatMoney(r.price, cur)}</td>
    <td class="right">${formatMoney(r.totalWithoutVat, cur)}</td>
    <td class="center">${r.vat}%</td>
    <td class="right">${formatMoney(r.vatAmount, cur)}</td>
    <td class="right">${formatMoney(r.total, cur)}</td>
  </tr>`).join("");

  const body = `
${bankBlock}
<div class="title">Счет на оплату № ${invoice.number} от ${formatDate(invoice.date)}</div>
<hr class="thick"/><hr class="thin"/>
<table style="margin:8px 0;">
  <tr><td style="width:100px;" class="bold">Поставщик:</td><td>${seller?.name || ""}, ИНН ${seller?.inn || ""}${seller?.kpp ? ", КПП " + seller.kpp : ""}, ${seller?.address || ""}</td></tr>
  <tr><td class="bold">Покупатель:</td><td>${buyer?.name || ""}, ИНН ${buyer?.inn || ""}${buyer?.kpp ? ", КПП " + buyer.kpp : ""}, ${buyer?.address || ""}</td></tr>
</table>
<table class="bordered">
  <thead>
    <tr>
      <th style="width:30px;">№</th>
      <th>Наименование товара, работы, услуги</th>
      <th style="width:40px;">Ед.</th>
      <th style="width:45px;">Кол-во</th>
      <th style="width:75px;">Цена</th>
      <th style="width:80px;">Сумма</th>
      <th style="width:40px;">НДС</th>
      <th style="width:75px;">Сумма НДС</th>
      <th style="width:85px;">Всего</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows}
  </tbody>
</table>
<table>
  <tr class="totals-row"><td colspan="7"></td><td class="right bold" style="width:160px;">Итого:</td><td class="right bold" style="width:85px;">${formatMoney(grandWithoutVat, cur)}</td></tr>
  <tr class="totals-row"><td colspan="7"></td><td class="right bold">В том числе НДС:</td><td class="right bold">${formatMoney(grandVat, cur)}</td></tr>
  <tr class="totals-row"><td colspan="7"></td><td class="right bold">Всего к оплате:</td><td class="right bold">${formatMoney(grandTotal, cur)}</td></tr>
</table>
<p style="margin:10px 0;font-size:11px;">Всего наименований ${rows.length}, на сумму ${formatMoney(grandTotal, cur)}</p>
<p style="margin-bottom:15px;font-size:11px;font-weight:bold;">${amountInWords(grandTotal)}</p>
<hr class="thin"/>
<table class="sign-block" style="width:100%;">
  <tr>
    <td style="width:50%;">
      <span class="bold">Руководитель</span> <span class="sign-line"></span> / ${seller?.director || "________________"} /
    </td>
    <td>
      <span class="bold">Бухгалтер</span> <span class="sign-line"></span> / ${seller?.accountant || "________________"} /
    </td>
  </tr>
</table>
${qrUrl ? `<div class="qr-block"><img src="${qrUrl}"/><div><p class="bold">QR-код для оплаты (СТ00012)</p><p>Сумма: ${formatMoney(grandTotal, cur)}</p></div></div>` : ""}
`;

  return wrapHTML(`Счет №${invoice.number}`, body);
}

export function printAct1C(act: Act, companies: Company[], products: Product[]): string {
  const { seller, buyer, rows, grandTotal, grandVat, grandWithoutVat } = getDocData(act.lines, companies, products, act.sellerId, act.buyerId);
  const cur = act.currency;

  const tableRows = rows.map((r, i) => `
  <tr>
    <td class="center">${i + 1}</td>
    <td>${r.name}</td>
    <td class="center">${r.unit}</td>
    <td class="right">${r.quantity}</td>
    <td class="right">${formatMoney(r.price, cur)}</td>
    <td class="right">${formatMoney(r.total, cur)}</td>
  </tr>`).join("");

  const body = `
<div class="title">Акт № ${act.number} от ${formatDate(act.date)}</div>
${act.contractNumber ? `<div class="subtitle">к договору № ${act.contractNumber} от ${act.contractDate ? formatDate(act.contractDate) : "___"}</div>` : ""}
<hr class="thick"/><hr class="thin"/>
<table style="margin:8px 0;">
  <tr><td style="width:100px;" class="bold">Исполнитель:</td><td>${seller?.name || ""}, ИНН ${seller?.inn || ""}${seller?.kpp ? ", КПП " + seller.kpp : ""}, ${seller?.address || ""}</td></tr>
  <tr><td class="bold">Заказчик:</td><td>${buyer?.name || ""}, ИНН ${buyer?.inn || ""}${buyer?.kpp ? ", КПП " + buyer.kpp : ""}, ${buyer?.address || ""}</td></tr>
</table>
<p style="margin:8px 0;">Мы, нижеподписавшиеся, Исполнитель — ${seller?.name || ""} в лице ${seller?.director || "___"}, с одной стороны, и Заказчик — ${buyer?.name || ""} в лице ${buyer?.director || "___"}, с другой стороны, составили настоящий Акт о том, что Исполнителем были выполнены следующие работы/оказаны услуги:</p>
<table class="bordered">
  <thead>
    <tr>
      <th style="width:30px;">№</th>
      <th>Наименование работы, услуги</th>
      <th style="width:40px;">Ед.</th>
      <th style="width:50px;">Кол-во</th>
      <th style="width:80px;">Цена</th>
      <th style="width:90px;">Сумма</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows}
  </tbody>
</table>
<table>
  <tr class="totals-row"><td colspan="4"></td><td class="right bold" style="width:100px;">Итого:</td><td class="right bold" style="width:90px;">${formatMoney(grandWithoutVat, cur)}</td></tr>
  <tr class="totals-row"><td colspan="4"></td><td class="right bold">НДС (${rows[0]?.vat || 20}%):</td><td class="right bold">${formatMoney(grandVat, cur)}</td></tr>
  <tr class="totals-row"><td colspan="4"></td><td class="right bold">Всего:</td><td class="right bold">${formatMoney(grandTotal, cur)}</td></tr>
</table>
<p style="margin:10px 0;font-size:11px;">Всего оказано услуг на сумму: <b>${amountInWords(grandTotal)}</b></p>
<p style="margin:5px 0;">Вышеперечисленные работы (услуги) выполнены полностью и в срок. Заказчик претензий по объему, качеству и срокам оказания услуг не имеет.</p>
<hr class="thin" style="margin-top:15px;"/>
<table class="sign-block" style="width:100%;">
  <tr>
    <td style="width:50%;padding-right:20px;">
      <p class="bold" style="margin-bottom:20px;">Исполнитель:</p>
      <p>${seller?.name || ""}</p>
      <br/>
      <p><span class="sign-line"></span> / ${seller?.director || "________________"} /</p>
      <p class="small">подпись</p>
      <br/>
      <p>М.П.</p>
    </td>
    <td style="padding-left:20px;">
      <p class="bold" style="margin-bottom:20px;">Заказчик:</p>
      <p>${buyer?.name || ""}</p>
      <br/>
      <p><span class="sign-line"></span> / ${buyer?.director || "________________"} /</p>
      <p class="small">подпись</p>
      <br/>
      <p>М.П.</p>
    </td>
  </tr>
</table>
`;
  return wrapHTML(`Акт №${act.number}`, body);
}

export function printUPD1C(upd: UPD, companies: Company[], products: Product[]): string {
  const { seller, buyer, rows, grandTotal, grandVat, grandWithoutVat } = getDocData(upd.lines, companies, products, upd.sellerId, upd.buyerId);
  const cur = upd.currency;
  const statusText = upd.status === "1" ? "Счет-фактура и передаточный документ (акт)" : "Передаточный документ (акт)";

  const tableRows = rows.map((r, i) => `
  <tr>
    <td class="center" style="font-size:9px;">1</td>
    <td class="center">${i + 1}</td>
    <td>${r.name}</td>
    <td class="center">${r.unit}</td>
    <td class="right">${r.quantity}</td>
    <td class="right">${formatMoney(r.price, cur)}</td>
    <td class="right">${formatMoney(r.totalWithoutVat, cur)}</td>
    <td class="center">${r.vat}%</td>
    <td class="right">${formatMoney(r.vatAmount, cur)}</td>
    <td class="right">${formatMoney(r.total, cur)}</td>
  </tr>`).join("");

  const body = `
<div style="text-align:right;font-size:10px;margin-bottom:5px;">Статус: <b>${upd.status}</b> — ${statusText}</div>
<table style="margin-bottom:5px;">
  <tr><td colspan="2" style="text-align:center;font-size:9px;color:#666;">Приложение №1 к постановлению Правительства РФ от 26.12.2011 №1137</td></tr>
</table>
<div class="title" style="font-size:12px;">Универсальный передаточный документ</div>
<table style="margin-bottom:5px;">
  <tr><td class="bold" style="width:200px;">Счёт-фактура №</td><td>${upd.number} от ${formatDate(upd.date)}</td></tr>
  ${upd.correctionNumber ? `<tr><td class="bold">Исправление №</td><td>${upd.correctionNumber}</td></tr>` : ""}
</table>
<hr class="thick"/>
<table style="margin:5px 0;font-size:10px;">
  <tr><td class="bold" style="width:130px;">Продавец (1):</td><td>${seller?.name || ""}</td></tr>
  <tr><td class="bold">Адрес (2):</td><td>${seller?.address || ""}</td></tr>
  <tr><td class="bold">ИНН/КПП (2б):</td><td>${seller?.inn || ""}${seller?.kpp ? " / " + seller.kpp : ""}</td></tr>
  <tr><td class="bold">Покупатель (6):</td><td>${buyer?.name || ""}</td></tr>
  <tr><td class="bold">Адрес (6а):</td><td>${buyer?.address || ""}</td></tr>
  <tr><td class="bold">ИНН/КПП (6б):</td><td>${buyer?.inn || ""}${buyer?.kpp ? " / " + buyer.kpp : ""}</td></tr>
  <tr><td class="bold">Валюта (7):</td><td>${cur === "RUB" ? "Российский рубль (643)" : cur}</td></tr>
</table>
<table class="bordered">
  <thead>
    <tr>
      <th style="width:20px;font-size:8px;">А</th>
      <th style="width:25px;">№<br/>(1)</th>
      <th>Наименование товара<br/>(описание работ, услуг) (1а)</th>
      <th style="width:35px;">Ед.<br/>(2а)</th>
      <th style="width:40px;">Кол-во<br/>(3)</th>
      <th style="width:70px;">Цена<br/>(4)</th>
      <th style="width:75px;">Стоимость без НДС<br/>(5)</th>
      <th style="width:35px;">Ставка<br/>НДС (7)</th>
      <th style="width:70px;">Сумма НДС<br/>(8)</th>
      <th style="width:80px;">Стоимость с НДС<br/>(9)</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows}
    <tr class="bold">
      <td colspan="6" class="right">Всего к оплате:</td>
      <td class="right">${formatMoney(grandWithoutVat, cur)}</td>
      <td class="center">X</td>
      <td class="right">${formatMoney(grandVat, cur)}</td>
      <td class="right">${formatMoney(grandTotal, cur)}</td>
    </tr>
  </tbody>
</table>
<hr class="thick" style="margin-top:10px;"/>
<div style="font-size:10px;text-align:center;margin:5px 0;font-weight:bold;">[ II. Передаточный документ (акт) ]</div>
<table style="margin:5px 0;font-size:10px;">
  <tr><td class="bold" style="width:250px;">Основание передачи (10):</td><td>${upd.correctionNumber ? "Договор №" + upd.correctionNumber : "Без договора"}</td></tr>
  <tr><td class="bold">Данные о транспортировке (11):</td><td>—</td></tr>
</table>
<p style="margin:10px 0;font-size:11px;">Всего к оплате: <b>${amountInWords(grandTotal)}</b></p>
<hr class="thin"/>
<table class="sign-block" style="width:100%;">
  <tr>
    <td style="width:50%;padding-right:15px;vertical-align:top;">
      <p class="bold" style="margin-bottom:8px;">Товар (груз) передал / услугу оказал:</p>
      <p>${seller?.name || ""}</p>
      <br/>
      <p><span class="sign-line"></span> / ${seller?.director || "________________"} /</p>
      <p class="small">подпись, дата</p>
      <p style="margin-top:10px;">М.П.</p>
    </td>
    <td style="padding-left:15px;vertical-align:top;">
      <p class="bold" style="margin-bottom:8px;">Товар (груз) получил / услугу принял:</p>
      <p>${buyer?.name || ""}</p>
      <br/>
      <p><span class="sign-line"></span> / ${buyer?.director || "________________"} /</p>
      <p class="small">подпись, дата</p>
      <p style="margin-top:10px;">М.П.</p>
    </td>
  </tr>
</table>
`;
  return wrapHTML(`УПД №${upd.number}`, body);
}

export function exportActExcel(act: Act, companies: Company[], products: Product[]) {
  const { seller, buyer, rows, grandTotal, grandVat, grandWithoutVat } = getDocData(act.lines, companies, products, act.sellerId, act.buyerId);
  return { seller, buyer, rows, grandTotal, grandVat, grandWithoutVat };
}
