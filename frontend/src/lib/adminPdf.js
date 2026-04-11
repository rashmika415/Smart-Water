/** @param {import('jspdf').jsPDF} doc */
export function pdfEnsureSpace(doc, y, needed, left, pageWidth) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 48) {
    doc.addPage();
    return 48;
  }
  return y;
}

export function pdfHeaderBanner(doc, { title, subtitle, left = 40 }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 48;
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(left, y - 28, pageWidth - left * 2, 56, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, left + 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, left + 14, y + 16);
  doc.setTextColor(30, 41, 59);
  return y + 44;
}

export function pdfFooterLine(doc, left) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(left, pageHeight - 32, pageWidth - left, pageHeight - 32);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("SmartWater Admin Report", left, pageHeight - 18);
}
