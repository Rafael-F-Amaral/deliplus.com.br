
import jsPDF from "jspdf";
import { leafTopLeft, leafBottomRight, logoDeli } from "./pdf-assets";

export interface ExtraShoppingItemPDF {
  id?: string;
  name: string;
  quantity?: number | string;
  unit?: string;
}

export const generateShoppingListPDF = (
  products: any[], 
  categories: any[], 
  extraItems: (string | ExtraShoppingItemPDF)[], 
  siteUrl: string = "deliplus.com.br"
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Background color pure white
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  // Add decorative leaves FIRST so text draws over them if anything
  // Top-left leaf - make it smaller and push it to the corner
  doc.addImage(leafTopLeft, 'PNG', -20, -15, 60, 90, 'leaf1', 'FAST');
  
  // Bottom-right leaf
  // Push the leaf further down and right so only the tips show like in the reference
  doc.addImage(leafBottomRight, 'PNG', 170, 220, 80, 53.3, 'leaf2', 'FAST');

  // Logo - Center horizontally
  doc.addImage(logoDeli, 'PNG', 88, 15, 34, 13, 'logo', 'FAST');

  // Slogan under logo
  doc.setFontSize(7);
  doc.setTextColor(120, 130, 120);
  // Using character spacing simulation by adding spaces, or just normal text
  doc.text("S O L U Ç Õ E S   P A R A   U M A   C O Z I N H A   M A I S   E F I C I E N T E", 105, 38, { align: "center" });


  // Top Left text
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 140);
  doc.text(["INGREDIENTES", "PARA", "GRANDES", "HISTÓRIAS"], 15, 60);
  doc.setDrawColor(196, 105, 73); // Orange
  doc.setLineWidth(0.4);
  doc.line(15, 75, 20, 75);

  // Top Right text (left-aligned but placed on the right side)
  doc.text(["BOA", "COMIDA", "MOVE", "NEGÓCIOS"], 175, 20);
  doc.line(175, 34, 180, 34);


  // Main Title
  doc.setFont("times", "normal"); // serif font
  doc.setFontSize(28);
  doc.setTextColor(34, 56, 41); // Dark green #223829
  doc.text("LISTA DE COMPRAS", 105, 55, { align: "center" });

  // Small centered orange line under the title
  doc.setDrawColor(196, 105, 73);
  doc.setLineWidth(0.6);
  doc.line(100, 62, 110, 62);

  // We REMOVED the "Abastecimento da semana" subtitle as requested!

  // Flat list instead of grouped
  const allItems: any[] = [...products];
  if (extraItems.length > 0) {
    extraItems.forEach(item => {
      if (typeof item === 'string') {
        allItems.push({ name: item, min_stock: null, unit: '', customQty: null });
      } else {
        const unitDisplay = item.unit === 'unidades' ? 'un' : item.unit === 'caixas' ? 'cx' : item.unit === 'pacotes' ? 'pct' : (item.unit || '');
        allItems.push({
          name: item.name,
          min_stock: null,
          unit: unitDisplay,
          customQty: item.quantity
        });
      }
    });
  }

  let cursorY = 75;
  const leftMargin = 40;
  const rightMargin = 170;

  // Header
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(34, 56, 41);
  doc.text("PRODUTOS", leftMargin, cursorY);
  doc.text("QUANTIDADE", rightMargin, cursorY, { align: "right" });
  
  cursorY += 2;
  doc.setDrawColor(180, 190, 180);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, cursorY, rightMargin, cursorY);
  cursorY += 7;

  // Items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 70, 60);

  allItems.forEach(item => {
    if (cursorY > 260) {
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
      cursorY = 30;
      
      doc.setFont("times", "bold");
      doc.setTextColor(34, 56, 41);
      doc.text("PRODUTOS", leftMargin, cursorY);
      doc.text("QUANTIDADE", rightMargin, cursorY, { align: "right" });
      cursorY += 2;
      doc.setDrawColor(180, 190, 180);
      doc.line(leftMargin, cursorY, rightMargin, cursorY);
      cursorY += 7;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 70, 60);
    }

    // Item Name
    doc.text(item.name, leftMargin, cursorY);
    
    // Item Quantity
    if (item.customQty !== undefined && item.customQty !== null) {
      const unit = item.unit ? ` ${item.unit}` : '';
      doc.setFont("helvetica", "bold");
      doc.text(`${item.customQty}${unit}`, rightMargin, cursorY, { align: "right" });
      doc.setFont("helvetica", "normal");
    } else if (item.min_stock !== null) {
      const qty = item.shoppingQty !== undefined ? item.shoppingQty : Math.max(1, item.min_stock * 2);
      const unit = item.unit === 'unidades' ? 'un' : item.unit;
      doc.setFont("helvetica", "bold");
      doc.text(qty + " " + unit, rightMargin, cursorY, { align: "right" });
      doc.setFont("helvetica", "normal");
    }

    cursorY += 7;
  });

  // Footer

  // Left text
  doc.setFontSize(10);
  doc.setFont("times", "italic");
  doc.setTextColor(80, 90, 80);
  doc.text(["Cozinhas", "que alimentam", "o amanhã"], 15, 270);
  doc.setDrawColor(196, 105, 73);
  doc.setLineWidth(0.5);
  doc.line(15, 285, 25, 285); // Orange line BELOW

  // Right text
  doc.setDrawColor(196, 105, 73);
  doc.setLineWidth(0.5);
  doc.line(175, 268, 185, 268); // Orange line ABOVE
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 120);
  // simulate letter spacing with spaces
  doc.text(["P E S S O A S", "A L I M E N T A M", "R E S U L T A D O S"], 175, 273);

  // Bottom Center line and Date
  doc.setDrawColor(200, 205, 200);
  doc.setLineWidth(0.2);
  doc.line(65, 276, 145, 276);

  doc.setFont("times", "normal"); // changed to serif to match image!
  doc.setFontSize(9);
  doc.setTextColor(100, 110, 100);
  const d = new Date();
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dateStr = `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  doc.text(siteUrl, 105, 281, { align: "center" });
  doc.text(dateStr, 105, 286, { align: "center" });

  // Fix bottom right leaf positioning
  // In the image, only the top branches are visible on the edge.
  // We should render the leaf AFTER the footer to ensure it overlays exactly like the reference, or just adjust its coords.
  // Wait, doc.addImage for leafBottomRight is done at the top. Let's modify the top coordinates instead.

  doc.save("Lista_de_Compras_DeliPlus.pdf");
};
