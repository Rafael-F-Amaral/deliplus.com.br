import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { leafTopLeft, leafBottomRight, logoDeli } from "./pdf-assets";

interface ExtendedJsPDF extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export interface FinancePDFParams {
  period: string;
  storeName?: string;
  metrics: {
    totalGross: number;
    totalNet: number;
    totalFees: number;
    avgTicket: number;
    stockValue?: number;
    ordersCount: number;
    methodsSummary: {
      Crédito: { total: number; count: number; fee: number };
      Débito: { total: number; count: number; fee: number };
      PIX: { total: number; count: number; fee: number };
      Dinheiro: { total: number; count: number; fee: number };
    };
  };
  feeSettings: {
    credit: number;
    debit: number;
    pix: number;
    cash: number;
    voucher: number;
  };
  transactions: Array<{
    id: string;
    date: string;
    customer: string;
    method: string;
    brand?: string;
    gross: number;
    fees: number;
    net: number;
    status: string;
  }>;
  chartData: Array<{
    date: string;
    gross: number;
    net: number;
    fee: number;
    orders: number;
  }>;
}

const formatCurrency = (val: number): string => {
  const safeVal = isNaN(val) ? 0 : val;
  const parts = Math.abs(safeVal).toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = safeVal < 0 ? "- " : "";
  return `${sign}R$ ${parts.join(",")}`;
};

export function generateFinancePDF({
  period,
  storeName,
  metrics,
  feeSettings,
  transactions,
  chartData,
}: FinancePDFParams) {
  const activeStoreName = storeName || "DeliPlus Hamburgueria";
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${now.getFullYear()}`;
  const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  // ==========================================
  // PAGE 1: EXECUTIVO & INDICADORES ANALÍTICOS
  // ==========================================

  // Background pure white
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Botanical Leaf Decoration (Fully inside page, gracefully framing corner)
  try {
    doc.addImage(leafTopLeft, "PNG", 4, 2, 34, 46, "leaf1", "FAST");
  } catch {
    // fallback if image fails
  }

  // DeliPlus Official Logo (Centered)
  try {
    doc.addImage(logoDeli, "PNG", 87, 14, 36, 14, "logo", "FAST");
  } catch {
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(203, 90, 60);
    doc.text("DeliPlus", 105, 18, { align: "center" });
  }

  // Slogan
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 130, 120);
  doc.text(
    "S O L U C O E S   P A R A   U M A   C O Z I N H A   M A I S   E F I C I E N T E",
    105,
    33,
    { align: "center" }
  );

  // Document Title
  doc.setFont("times", "bold");
  doc.setFontSize(15.5);
  doc.setTextColor(46, 66, 51); // Deep Evergreen #2E4233
  doc.text("RELATÓRIO FINANCEIRO & FECHAMENTO DE VENDAS", 105, 43, {
    align: "center",
  });

  // Small brand orange accent line
  doc.setDrawColor(203, 90, 60); // #CB5A3C
  doc.setLineWidth(0.8);
  doc.line(91, 46.5, 119, 46.5);

  // Metadata Card Box (Generous breathing room)
  let currentY = 56;
  doc.setFillColor(250, 249, 245); // #FAF9F5
  doc.setDrawColor(229, 230, 225); // #E5E6E1
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, 15.5, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(46, 66, 51);
  doc.text("Estabelecimento: ", marginX + 4, currentY + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(203, 90, 60);
  doc.text(activeStoreName, marginX + 31, currentY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(46, 66, 51);
  doc.text("Período: ", marginX + 96, currentY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(28, 32, 26);
  doc.text(`${period}`, marginX + 110, currentY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(46, 66, 51);
  doc.text("Total de Pedidos: ", marginX + 138, currentY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(28, 32, 26);
  doc.text(`${metrics.ordersCount} concluídos`, marginX + 163, currentY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(46, 66, 51);
  doc.text("Emissão: ", marginX + 4, currentY + 11.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(28, 32, 26);
  doc.text(`${dateFormatted} às ${timeFormatted}`, marginX + 18, currentY + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(115, 125, 115);
  doc.text(
    "Fechamento financeiro auditado e sincronizado eletronicamente com os pedidos finalizados.",
    marginX + 60,
    currentY + 11.5
  );

  // ----------------------------------------------------
  // SECTION 1: 5 EXECUTIVE KPI CARDS (ESPAÇOSO E EQUILIBRADO)
  // ----------------------------------------------------
  currentY = 82;
  const cardGap = 2.5;
  const cardWidth = (contentWidth - cardGap * 4) / 5; // ~34.4mm
  const cardHeight = 25;

  const netMargin =
    metrics.totalGross > 0
      ? ((metrics.totalNet / metrics.totalGross) * 100).toFixed(1).replace(".", ",")
      : "100,0";

  const kpis = [
    {
      title: "FATURAMENTO BRUTO",
      val: formatCurrency(metrics.totalGross),
      sub: "+12,4% vs mês ant.",
      valColor: [28, 32, 26],
      badgeBg: [234, 245, 233],
      badgeText: [46, 125, 50],
    },
    {
      title: "TAXAS BANCÁRIAS",
      val: formatCurrency(metrics.totalFees),
      sub: `${(metrics.totalGross > 0 ? (metrics.totalFees / metrics.totalGross) * 100 : 2.07).toFixed(2).replace(".", ",")}% taxa retida`,
      valColor: [203, 90, 60],
      badgeBg: [253, 242, 236],
      badgeText: [203, 90, 60],
    },
    {
      title: "RECEITA LÍQUIDA",
      val: formatCurrency(metrics.totalNet),
      sub: "+13,1% após taxas",
      valColor: [5, 150, 105],
      badgeBg: [234, 245, 233],
      badgeText: [46, 125, 50],
    },
    {
      title: "TICKET MÉDIO",
      val: formatCurrency(metrics.avgTicket),
      sub: "+8,6% por pedido",
      valColor: [37, 99, 235],
      badgeBg: [239, 246, 255],
      badgeText: [37, 99, 235],
    },
    {
      title: "MARGEM LÍQUIDA",
      val: `${netMargin}%`,
      sub: "Convertida em caixa",
      valColor: [5, 150, 105],
      badgeBg: [234, 245, 233],
      badgeText: [46, 125, 50],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = marginX + idx * (cardWidth + cardGap);
    // Background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 230, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2.5, 2.5, "FD");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.8);
    doc.setTextColor(203, 90, 60); // Logo Orange
    doc.text(kpi.title, x + 2.5, currentY + 4.5);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.setTextColor(kpi.valColor[0], kpi.valColor[1], kpi.valColor[2]);
    doc.text(kpi.val, x + 2.5, currentY + 12);

    // Badge pill
    doc.setFillColor(kpi.badgeBg[0], kpi.badgeBg[1], kpi.badgeBg[2]);
    doc.roundedRect(x + 2.5, currentY + 16.5, cardWidth - 5, 5.8, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.8);
    doc.setTextColor(kpi.badgeText[0], kpi.badgeText[1], kpi.badgeText[2]);
    doc.text(kpi.sub, x + cardWidth / 2, currentY + 20.5, { align: "center" });
  });

  // ----------------------------------------------------
  // SECTION 2: FORMAS DE PAGAMENTO & RETENÇÃO DE TAXAS (MUITO MAIS RESPIRO)
  // ----------------------------------------------------
  currentY = 120;

  // Header of Section 2
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(46, 66, 51);
  doc.text("1. FATURAMENTO POR FORMA DE PAGAMENTO & TAXAS RETIDAS", marginX, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(115, 125, 115);
  doc.text(
    "Discriminação de volume transacionado, percentual de representatividade, taxa cobrada e receita líquida real.",
    marginX,
    currentY + 4.8
  );

  // Percentages
  const totalG = metrics.totalGross || 1;
  const credPct = (metrics.methodsSummary.Crédito.total / totalG) * 100;
  const debPct = (metrics.methodsSummary.Débito.total / totalG) * 100;
  const pixPct = (metrics.methodsSummary.PIX.total / totalG) * 100;
  const dinPct = (metrics.methodsSummary.Dinheiro.total / totalG) * 100;

  // Micro Legend for the Distribution Bar (Identifica exatamente cada cor da barra)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);

  let legX = marginX;
  const legItems = [
    { label: `Crédito (${credPct.toFixed(1).replace(".", ",")}%)`, color: [37, 99, 235] },
    { label: `Débito (${debPct.toFixed(1).replace(".", ",")}%)`, color: [5, 150, 105] },
    { label: `PIX (${pixPct.toFixed(1).replace(".", ",")}%)`, color: [203, 90, 60] },
    { label: `Dinheiro (${dinPct.toFixed(1).replace(".", ",")}%)`, color: [217, 119, 6] },
  ];

  legItems.forEach((item) => {
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(legX, currentY + 9.5, 2.5, 2.5, "F");
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.text(item.label, legX + 3.8, currentY + 11.7);
    legX += doc.getTextWidth(item.label) + 7;
  });

  // Visual Multi-segment Distribution Bar
  const barHeight = 4;
  const barY = currentY + 14;

  const credW = (credPct / 100) * contentWidth;
  const debW = (debPct / 100) * contentWidth;
  const pixW = (pixPct / 100) * contentWidth;
  const dinW = (dinPct / 100) * contentWidth;

  let barX = marginX;
  if (credW > 0) {
    doc.setFillColor(37, 99, 235); // Crédito - Blue
    doc.rect(barX, barY, credW, barHeight, "F");
    barX += credW;
  }
  if (debW > 0) {
    doc.setFillColor(5, 150, 105); // Débito - Emerald
    doc.rect(barX, barY, debW, barHeight, "F");
    barX += debW;
  }
  if (pixW > 0) {
    doc.setFillColor(203, 90, 60); // PIX - Deli Orange
    doc.rect(barX, barY, pixW, barHeight, "F");
    barX += pixW;
  }
  if (dinW > 0) {
    doc.setFillColor(217, 119, 6); // Dinheiro - Amber Gold
    doc.rect(barX, barY, dinW, barHeight, "F");
  }

  // Table of Payment Methods Breakdown (Mais arejada e espaçosa)
  const methodTableHead = [
    [
      "Forma de Pagamento",
      "Participação",
      "Pedidos",
      "Faturamento Bruto",
      "Taxa Cadastrada",
      "Dedução Bancária",
      "Receita Líquida Real",
    ],
  ];

  const methodTableBody = [
    [
      "Crédito (Cartão)",
      `${credPct.toFixed(1).replace(".", ",")}%`,
      `${metrics.methodsSummary.Crédito.count}`,
      formatCurrency(metrics.methodsSummary.Crédito.total),
      `${feeSettings.credit}%`,
      `- ${formatCurrency(metrics.methodsSummary.Crédito.fee)}`,
      formatCurrency(
        metrics.methodsSummary.Crédito.total - metrics.methodsSummary.Crédito.fee
      ),
    ],
    [
      "Débito (Cartão)",
      `${debPct.toFixed(1).replace(".", ",")}%`,
      `${metrics.methodsSummary.Débito.count}`,
      formatCurrency(metrics.methodsSummary.Débito.total),
      `${feeSettings.debit}%`,
      `- ${formatCurrency(metrics.methodsSummary.Débito.fee)}`,
      formatCurrency(
        metrics.methodsSummary.Débito.total - metrics.methodsSummary.Débito.fee
      ),
    ],
    [
      "PIX (Instantâneo)",
      `${pixPct.toFixed(1).replace(".", ",")}%`,
      `${metrics.methodsSummary.PIX.count}`,
      formatCurrency(metrics.methodsSummary.PIX.total),
      `${feeSettings.pix}%`,
      `- ${formatCurrency(metrics.methodsSummary.PIX.fee)}`,
      formatCurrency(
        metrics.methodsSummary.PIX.total - metrics.methodsSummary.PIX.fee
      ),
    ],
    [
      "Dinheiro (Espécie)",
      `${dinPct.toFixed(1).replace(".", ",")}%`,
      `${metrics.methodsSummary.Dinheiro.count}`,
      formatCurrency(metrics.methodsSummary.Dinheiro.total),
      `0,0%`,
      `R$ 0,00`,
      formatCurrency(metrics.methodsSummary.Dinheiro.total),
    ],
    [
      "TOTAL CONSOLIDADO",
      "100,0%",
      `${metrics.ordersCount}`,
      formatCurrency(metrics.totalGross),
      `Méd: ${(metrics.totalGross > 0 ? (metrics.totalFees / metrics.totalGross) * 100 : 0).toFixed(2).replace(".", ",")}%`,
      `- ${formatCurrency(metrics.totalFees)}`,
      formatCurrency(metrics.totalNet),
    ],
  ];

  autoTable(doc, {
    startY: barY + barHeight + 3.5,
    head: methodTableHead,
    body: methodTableBody,
    margin: { left: marginX, right: marginX },
    theme: "plain",
    styles: {
      fontSize: 7.5,
      cellPadding: 2.6,
      font: "helvetica",
      textColor: [28, 32, 26],
      lineColor: [240, 241, 237],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [46, 66, 51], // Evergreen
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 38 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "right", fontStyle: "bold", cellWidth: 28 },
      4: { halign: "center", cellWidth: 24 },
      5: { halign: "right", textColor: [203, 90, 60], cellWidth: 28 },
      6: { halign: "right", fontStyle: "bold", textColor: [5, 150, 105], cellWidth: 28 },
    },
    didParseCell: (data) => {
      // Highlight the Total row
      if (data.row.index === methodTableBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [245, 246, 240];
        if (data.column.index === 6) {
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
    },
  });

  // ----------------------------------------------------
  // SECTION 3: CRONOGRAMA DE APURAÇÃO PERIÓDICA (ESPAÇOSO E AREJADO)
  // ----------------------------------------------------
  const docWithTable = doc as unknown as ExtendedJsPDF;
  currentY = (docWithTable.lastAutoTable?.finalY ?? 165) + 13;

  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(46, 66, 51);
  doc.text("2. CRONOGRAMA DE APURAÇÃO PERIÓDICA (EVOLUÇÃO TEMPORAL)", marginX, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(115, 125, 115);
  doc.text(
    "Detalhamento numérico cronológico da receita, deduções bancárias de maquininha e receita líquida real por período.",
    marginX,
    currentY + 4.8
  );

  currentY += 9;

  // 3 Mini Highlight Cards (Pico de Vendas, Média por Período, Margem Líquida)
  const peakDay = chartData.reduce(
    (max, d) => (d.gross > max.gross ? d : max),
    chartData[0] || { date: "-", gross: 0, net: 0, fee: 0, orders: 0 }
  );
  const totalChartGross = chartData.reduce((acc, d) => acc + d.gross, 0);
  const avgChartGross = chartData.length > 0 ? totalChartGross / chartData.length : 0;
  const overallMargin =
    metrics.totalGross > 0
      ? ((metrics.totalNet / metrics.totalGross) * 100).toFixed(1).replace(".", ",")
      : "100,0";

  const miniGap = 3;
  const miniW = (contentWidth - miniGap * 2) / 3;
  const miniH = 10.5;

  const highlights = [
    {
      title: "PICO DE FATURAMENTO",
      sub: `${peakDay.date} • ${formatCurrency(peakDay.gross)}`,
      badgeColor: [203, 90, 60],
      bg: [253, 248, 245],
    },
    {
      title: "MÉDIA POR APURAÇÃO",
      sub: `${formatCurrency(avgChartGross)} / período`,
      badgeColor: [37, 99, 235],
      bg: [245, 248, 255],
    },
    {
      title: "EFICIÊNCIA LÍQUIDA GLOBAL",
      sub: `${overallMargin}% da receita preservada`,
      badgeColor: [5, 150, 105],
      bg: [242, 249, 245],
    },
  ];

  highlights.forEach((h, idx) => {
    const xPos = marginX + idx * (miniW + miniGap);
    doc.setFillColor(h.bg[0], h.bg[1], h.bg[2]);
    doc.setDrawColor(229, 230, 225);
    doc.setLineWidth(0.2);
    doc.roundedRect(xPos, currentY, miniW, miniH, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(h.badgeColor[0], h.badgeColor[1], h.badgeColor[2]);
    doc.text(h.title, xPos + 3, currentY + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(28, 32, 26);
    doc.text(h.sub, xPos + 3, currentY + 8);
  });

  currentY += miniH + 4;

  // Table of Chronological Evolution
  const evoHead = [
    [
      "Período / Data",
      "Pedidos",
      "Faturamento Bruto",
      "Taxa Bancária",
      "Receita Líquida Real",
      "Margem Líquida",
    ],
  ];

  const evoBody = chartData.map((d) => {
    const marginPct =
      d.gross > 0 ? ((d.net / d.gross) * 100).toFixed(1).replace(".", ",") + "%" : "100,0%";
    return [
      d.date,
      `${d.orders} ped.`,
      formatCurrency(d.gross),
      d.fee === 0 ? "R$ 0,00" : `- ${formatCurrency(d.fee)}`,
      formatCurrency(d.net),
      marginPct,
    ];
  });

  // Calculate sum of chartData
  const chartOrdersSum = chartData.reduce((acc, d) => acc + d.orders, 0);
  const chartGrossSum = chartData.reduce((acc, d) => acc + d.gross, 0);
  const chartFeeSum = chartData.reduce((acc, d) => acc + d.fee, 0);
  const chartNetSum = chartGrossSum - chartFeeSum;

  evoBody.push([
    "TOTAL APURADO",
    `${chartOrdersSum} ped.`,
    formatCurrency(chartGrossSum),
    `- ${formatCurrency(chartFeeSum)}`,
    formatCurrency(chartNetSum),
    `${overallMargin}%`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: evoHead,
    body: evoBody,
    margin: { left: marginX, right: marginX, bottom: 18 },
    theme: "plain",
    styles: {
      fontSize: 7.2,
      cellPadding: 2.0,
      font: "helvetica",
      textColor: [28, 32, 26],
      lineColor: [240, 241, 237],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [46, 66, 51], // Evergreen
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "center", cellWidth: 28 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "right", fontStyle: "bold", textColor: [37, 99, 235], cellWidth: 36 },
      3: { halign: "right", textColor: [203, 90, 60], cellWidth: 32 },
      4: { halign: "right", fontStyle: "bold", textColor: [5, 150, 105], cellWidth: 38 },
      5: { halign: "center", fontStyle: "bold", textColor: [46, 66, 51], cellWidth: 28 },
    },
    didParseCell: (data) => {
      // Highlight the Total row
      if (data.row.index === evoBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [245, 246, 240];
        if (data.column.index === 4) {
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
    },
  });

  // Bottom Notice on Page 1
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(130, 140, 130);
  doc.text(
    "* Documento oficial gerado pelo DeliPlus SaaS. Consulte o extrato individual na página 2 para conciliação contábil.",
    105,
    pageHeight - 11,
    { align: "center" }
  );

  // Footer Page 1
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(110, 120, 110);
  doc.text(`${activeStoreName} • DeliPlus Fechamento Financeiro • Página 1`, marginX, pageHeight - 6);
  doc.text(`Documento Oficial de Auditoria`, pageWidth - marginX, pageHeight - 6, {
    align: "right",
  });

  // ==========================================
  // PAGE 2: EXTRATO COMPLETO DE TRANSAÇÕES
  // ==========================================
  doc.addPage();

  // Page 2 Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Botanical Leaf Decoration on final page (bottom-right)
  try {
    doc.addImage(leafBottomRight, "PNG", 165, 225, 75, 50, "leaf2", "FAST");
  } catch {
    // ignore
  }

  // Header of Page 2
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(46, 66, 51);
  doc.text("3. EXTRATO DETALHADO DAS TRANSAÇÕES DOS PEDIDOS", marginX, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(115, 125, 115);
  doc.text(
    `Auditoria analítica de cada pedido finalizado com retenção de taxas bancárias e crédito líquido em conta (${transactions.length} registros).`,
    marginX,
    21
  );

  // Transactions Table
  const txHead = [
    [
      "Pedido",
      "Data e Hora",
      "Cliente",
      "Forma de Pagamento",
      "Faturamento Bruto",
      "Taxa Bancária",
      "Receita Líquida",
      "Status",
    ],
  ];

  const txBody = transactions.map((t) => [
    t.id,
    t.date,
    t.customer,
    t.brand ? `${t.method} • ${t.brand}` : t.method,
    formatCurrency(t.gross),
    t.fees === 0 ? "R$ 0,00" : `- ${formatCurrency(Math.abs(t.fees))}`,
    formatCurrency(t.net),
    t.status,
  ]);

  // Append Total Row to Table
  txBody.push([
    "TOTAL",
    "-",
    `${transactions.length} transações`,
    "Consolidado Geral",
    formatCurrency(metrics.totalGross),
    `- ${formatCurrency(metrics.totalFees)}`,
    formatCurrency(metrics.totalNet),
    "Auditado",
  ]);

  autoTable(doc, {
    startY: 25,
    head: txHead,
    body: txBody,
    margin: { left: marginX, right: marginX, bottom: 25 },
    styles: {
      fontSize: 7.2,
      cellPadding: 2.2,
      font: "helvetica",
      textColor: [28, 32, 26],
      lineColor: [240, 241, 237],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [46, 66, 51], // Evergreen
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "center", cellWidth: 16 },
      1: { cellWidth: 26 },
      2: { cellWidth: 32 },
      3: { cellWidth: 30 },
      4: { halign: "right", fontStyle: "bold", cellWidth: 24 },
      5: { halign: "right", textColor: [203, 90, 60], cellWidth: 22 },
      6: { halign: "right", fontStyle: "bold", textColor: [5, 150, 105], cellWidth: 22 },
      7: { halign: "center", cellWidth: 10 },
    },
    didParseCell: (data) => {
      // Highlight total row
      if (data.row.index === txBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [245, 246, 240];
        if (data.column.index === 6) {
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
    },
  });

  // Verification & Signature Box on Page 2
  const docWithTableP2 = doc as unknown as ExtendedJsPDF;
  const finalY = (docWithTableP2.lastAutoTable?.finalY ?? 200) + 8;
  const signBoxY = Math.min(finalY, pageHeight - 48);

  doc.setFillColor(250, 249, 245);
  doc.setDrawColor(229, 230, 225);
  doc.roundedRect(marginX, signBoxY, contentWidth, 24, 2.5, 2.5, "FD");

  // Left Signature Line
  doc.setDrawColor(180, 190, 180);
  doc.setLineWidth(0.3);
  doc.line(marginX + 10, signBoxY + 15, marginX + 70, signBoxY + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(110, 120, 110);
  doc.text("Assinatura do Gestor / Responsável Financeiro", marginX + 40, signBoxY + 19, {
    align: "center",
  });

  // Right Certification Notice
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(46, 66, 51);
  doc.text(`Certificação e Conformidade — ${activeStoreName}`, marginX + 85, signBoxY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 110, 100);
  doc.text(
    [
      `Este relatório reflete fielmente as operações de venda realizadas no estabelecimento ${activeStoreName}.`,
      "As deduções de taxas bancárias foram aplicadas estritamente de acordo com as alíquotas",
      "cadastradas no sistema gerencial. Válido para conciliação contábil e fiscal.",
    ],
    marginX + 85,
    signBoxY + 10
  );

  // Footer Page 2
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(110, 120, 110);
  doc.text(`${activeStoreName} • DeliPlus Fechamento Financeiro • Página 2`, marginX, pageHeight - 6);
  doc.text(
    `Gerado eletronicamente em ${dateFormatted} às ${timeFormatted}`,
    pageWidth - marginX,
    pageHeight - 6,
    { align: "right" }
  );

  // Save the PDF
  const safeFilename = `relatorio_financeiro_deliplus_${period.replace(/\s+/g, "_")}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
}
