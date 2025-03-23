import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export function exportToExcel(filename: string, data: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(filename: string, data: any[]) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(filename, 20, 20);
  
  // Add data
  doc.setFontSize(12);
  data.forEach((item, index) => {
    const y = 40 + (index * 10);
    doc.text(JSON.stringify(item), 20, y);
  });
  
  doc.save(`${filename}.pdf`);
}