async function crearDocumentoPDF(snapshot = crearSnapshotActual()){
  if(!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error("No cargó la librería PDF.");
  }

  const form = snapshot.form;
  const items = snapshot.items || [];
  const t = snapshot.totals || calcularTotales(items, form.iva);
  const footer = snapshot.footer || form.footer || getFooter();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"letter"});

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const blue = [21,59,255];
  const blueDark = [11,31,122];
  const line = [217,222,234];

  // =========================
  // HEADER AZUL
  // =========================
  doc.setFillColor(...blue);
  doc.rect(0, 0, W, 30, "F");

  // Caja blanca del logo
  doc.setFillColor(255,255,255);
  doc.roundedRect(14, 8, 44, 11, 4, 4, "F");

  const logoDataUrl = await getTuttoLogoPngDataUrl();

  if(logoDataUrl){
    try{
      doc.addImage(logoDataUrl, "PNG", 16, 10.2, 39.5, 6.9, undefined, "FAST");
    }catch(error){
      console.warn("No se pudo insertar el logo en el PDF:", error);
      doc.setFont("helvetica","bold");
      doc.setFontSize(14);
      doc.setTextColor(...blue);
      doc.text("TUTTO VINILOS", 36, 15.2, {align:"center"});
    }
  }else{
    doc.setFont("helvetica","bold");
    doc.setFontSize(14);
    doc.setTextColor(...blue);
    doc.text("TUTTO VINILOS", 36, 15.2, {align:"center"});
  }

  // Datos superiores derechos
  doc.setTextColor(255,255,255);
  doc.setFont("helvetica","bold");
  doc.setFontSize(8.5);
  doc.text("Tel: 0414-414-3004", W - 14, 10.8, {align:"right"});
  doc.text("Email: tuttovinilos@gmail.com", W - 14, 15.4, {align:"right"});
  doc.text("RIF: J-40218250-3", W - 14, 20, {align:"right"});

  // =========================
  // TÍTULO COTIZACIÓN
  // =========================
  doc.setFillColor(...blueDark);
  doc.roundedRect(14, 35, W - 28, 11, 4, 4, "F");

  doc.setFont("helvetica","bold");
  doc.setFontSize(15);
  doc.setTextColor(255,255,255);
  doc.text((form.tipo || "Cotización").toUpperCase(), W / 2, 42.2, {align:"center"});

  // =========================
  // FECHA / DOCUMENTO / VÁLIDO HASTA
  // =========================
  const topY = 50;
  const fieldH = 10;

  drawPdfField(doc, 14, topY, 54, fieldH, "Fecha", form.fecha || "", {
    labelSize: 5.7,
    valueSize: 8.2,
    valueBold: true,
    radius: 3,
    maxLines: 1
  });

  drawPdfField(doc, 71, topY, 62, fieldH, "N° Documento", form.numero || "", {
    labelSize: 5.7,
    valueSize: 8.2,
    valueBold: true,
    radius: 3,
    maxLines: 1
  });

  drawPdfField(doc, 136, topY, 62, fieldH, "Válido hasta", form.vence || "", {
    labelSize: 5.7,
    valueSize: 8.2,
    valueBold: true,
    radius: 3,
    maxLines: 1
  });

  // =========================
  // DATOS DEL CLIENTE COMPACTOS
  // =========================
  doc.setFont("helvetica","bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...blue);
  doc.text("DATOS DEL CLIENTE", 14, 66);

  doc.setDrawColor(...line);
  doc.line(14, 67.5, W - 14, 67.5);

  // Fila 1: Cliente / RIF-Cédula / Teléfono
  drawPdfField(doc, 14, 70, 67, 10, "Cliente", form.cliente || "", {
    labelSize: 5.5,
    valueSize: 7.3,
    valueBold: true,
    maxLines: 1,
    radius: 3
  });

  drawPdfField(doc, 84, 70, 55, 10, "RIF / Cédula", form.rif || "", {
    labelSize: 5.5,
    valueSize: 7.3,
    maxLines: 1,
    radius: 3
  });

  drawPdfField(doc, 142, 70, 56, 10, "Teléfono", form.telefono || "", {
    labelSize: 5.5,
    valueSize: 7.3,
    maxLines: 1,
    radius: 3
  });

  // Fila 2: Email / Dirección
  drawPdfField(doc, 14, 83, 67, 10, "Email", form.email || "", {
    labelSize: 5.5,
    valueSize: 7.1,
    maxLines: 1,
    radius: 3
  });

  drawPdfField(doc, 84, 83, 114, 10, "Dirección", form.direccion || "", {
    labelSize: 5.5,
    valueSize: 7.1,
    maxLines: 1,
    radius: 3
  });

  // =========================
  // TABLA DE PRODUCTOS / SERVICIOS
  // =========================
  let count = 1;

  const body = items.map(item => {
    if(item.kind === "separator"){
      return [{
        content: item.desc || "SECCIÓN",
        colSpan: 5,
        styles: {
          halign: "center",
          fontStyle: "bold",
          fillColor: [232,236,255],
          textColor: [11,31,122]
        }
      }];
    }

    const total = itemTotal(item);

    return [
      String(count++),
      item.desc || "",
      String(item.qty || 0),
      "$" + Number(item.price || 0).toFixed(2),
      "$" + total.toFixed(2)
    ];
  });

  doc.autoTable({
    startY: 101,
    head: [["#","DESCRIPCIÓN DEL PRODUCTO / SERVICIO","CANT.","P. UNIT ($)","TOTAL ($)"]],
    body,
    theme: "grid",
    margin: {left:14, right:14, bottom:26},

    styles: {
      font: "helvetica",
      fontSize: 7.7,
      cellPadding: 2.3,
      textColor: [17,17,17],
      lineColor: [217,222,234],
      lineWidth: 0.2,
      overflow: "linebreak",
      valign: "middle"
    },

    headStyles: {
      fillColor: [243,245,252],
      textColor: [17,17,17],
      fontStyle: "bold",
      halign: "center",
      fontSize: 7.2
    },

    columnStyles: {
      0: {
        halign: "center",
        cellWidth: 12,
        fontStyle: "bold",
        textColor: [220,38,38]
      },
      1: {
        cellWidth: "auto"
      },
      2: {
        halign: "center",
        cellWidth: 19
      },
      3: {
        halign: "center",
        cellWidth: 28
      },
      4: {
        halign: "center",
        cellWidth: 30,
        fontStyle: "bold",
        textColor: [21,59,255]
      }
    },

    alternateRowStyles: {
      fillColor: [252,252,254]
    },

    didDrawPage: () => {
      drawPdfHeaderFooter(doc, footer, form);
    }
  });

  // =========================
  // NOTAS Y TOTAL
  // =========================
  let fy = doc.lastAutoTable.finalY + 6;

  const notesH = form.notas ? 33 : 18;
  const rightBoxH = Number(t.iva || 0) > 0 ? 33 : 25;

  if(fy > H - Math.max(notesH, rightBoxH) - 26){
    doc.addPage();
    fy = 20;
  }

  const leftW = 126;
  const rightX = 145;
  const rightW = W - rightX - 14;

  if(form.notas){
    doc.setDrawColor(...line);
    doc.setFillColor(252,252,254);
    doc.roundedRect(14, fy, leftW, 33, 3, 3, "FD");

    doc.setFont("helvetica","bold");
    doc.setFontSize(8);
    doc.setTextColor(...blueDark);
    doc.text("NOTAS / CONDICIONES", 17, fy + 5.5);

    doc.setFont("helvetica","normal");
    doc.setFontSize(8.4);
    doc.setTextColor(70,74,82);

    const lines = doc.splitTextToSize(form.notas, leftW - 6);
    doc.text(lines.slice(0, 7), 17, fy + 11);
  }

  doc.setDrawColor(...line);
  doc.setFillColor(255,255,255);
  doc.roundedRect(rightX, fy, rightW, rightBoxH, 3, 3, "FD");

  let rowY = fy;

  const drawSummaryRow = (label, value, fill, txtColor, bold = false, size = 9.2) => {
    doc.setFillColor(...fill);
    doc.rect(rightX, rowY, rightW, 8, "F");

    doc.setDrawColor(...line);
    doc.rect(rightX, rowY, rightW, 8);

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...txtColor);

    doc.text(label, rightX + 3, rowY + 5.4);
    doc.text(value, rightX + rightW - 3, rowY + 5.4, {align:"right"});

    rowY += 8;
  };

  drawSummaryRow("Sub Total", currency(t.subtotal), [255,255,255], [17,24,39], true);

  if(Number(t.iva || 0) > 0){
    drawSummaryRow("IVA 16%", currency(t.iva), [255,255,255], [17,24,39], true);
  }

  doc.setFillColor(...blue);
  doc.roundedRect(rightX, rowY, rightW, 10, 0, 0, "F");

  doc.setFont("helvetica","bold");
  doc.setFontSize(12);
  doc.setTextColor(255,255,255);

  doc.text("TOTAL", rightX + 3, rowY + 6.7);
  doc.text(currency(t.total), rightX + rightW - 3, rowY + 6.7, {align:"right"});

  drawPdfHeaderFooter(doc, footer, form);

  return doc;
}