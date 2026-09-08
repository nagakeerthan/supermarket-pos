import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, StoreSettings, BillFormatConfig } from '../types';
import Papa from 'papaparse';

export function generateInvoicePdf(order: Order, settings: StoreSettings, billFormat?: BillFormatConfig) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const storeName = billFormat?.storeName || settings.storeName || 'KALASAGAR SUPERMARKET';
  const tagline = billFormat?.tagline || settings.tagline || '';
  const address = billFormat?.address || settings.address || '';
  const city = billFormat?.city || settings.city || '';
  const gstin = billFormat?.gstin || settings.gstin || '';
  const fssai = billFormat?.fssaiNumber || settings.fssaiNumber || '';
  const currency = billFormat?.customCurrencySymbol || settings.currencySymbol || '₹';
  const labels = billFormat?.customLabels;
  const title = billFormat?.headerCustomText || labels?.invoiceTitle || 'TAX INVOICE';
  const footerText = billFormat?.thankYouMessage || settings.receiptFooter || 'THANK YOU FOR SHOPPING WITH US!';
  const returnPolicy = billFormat?.returnPolicy || settings.returnPolicy || '';

  // Header
  doc.setFillColor(15, 23, 42); // Navy primary
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName, 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (tagline) doc.text(tagline, 14, 25);
  else if (address) doc.text(`${address}${city ? `, ${city}` : ''}`, 14, 25);

  // Invoice Title Right
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 196, 16, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (gstin) doc.text(`GSTIN: ${gstin}`, 196, 23, { align: 'right' });
  if (fssai) doc.text(`FSSAI: ${fssai}`, 196, 28, { align: 'right' });

  // Invoice Metadata Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${labels?.invoiceNoLabel || 'Invoice No:'} ${order.invoiceNumber}`, 14, 45);
  doc.text(`${labels?.dateLabel || 'Date & Time:'} ${new Date(order.createdAt).toLocaleString('en-IN')}`, 14, 51);
  doc.text(`${labels?.cashierLabel || 'Cashier:'} ${order.cashier.name}`, 14, 57);

  if (order.customer) {
    doc.text(`${labels?.customerLabel || 'Customer:'} ${order.customer.name} (${order.customer.phone})`, 196, 45, { align: 'right' });
    doc.text(`Points Earned: +${order.customer.pointsEarned} pts`, 196, 51, { align: 'right' });
  }
  doc.text(`${labels?.paymentModeLabel || 'Payment:'} ${order.paymentMethod.toUpperCase()}`, 196, 57, { align: 'right' });

  // Order Items Table
  const tableData = order.items.map((item, idx) => [
    idx + 1,
    item.productName,
    item.barcode,
    item.mrp.toFixed(2),
    item.sellingPrice.toFixed(2),
    String(item.quantity),
    item.discountAmount > 0 ? `-${item.discountAmount.toFixed(2)}` : '-',
    `${item.gstRate}%`,
    item.total.toFixed(2),
  ]);

  autoTable(doc, {
    startY: 63,
    head: [[
      '#',
      labels?.itemHeader || 'Item Description',
      'Barcode',
      labels?.mrpHeader || 'MRP',
      labels?.rateHeader || 'Rate',
      labels?.qtyHeader || 'Qty',
      'Disc',
      'GST',
      labels?.totalHeader || 'Total',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 65 },
      2: { cellWidth: 28 },
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 15, halign: 'right' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 20, halign: 'right' },
    },
  });

  // Summary Totals
  const lastTableInfo = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  const finalY = lastTableInfo ? lastTableInfo.finalY + 8 : 180;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${labels?.itemsCountLabel || 'Total Items:'} ${order.totalItems}`, 14, finalY);

  const startRight = 135;
  doc.text(labels?.subtotalLabel || 'Subtotal:', startRight, finalY);
  doc.text(`${currency}${order.subtotal.toFixed(2)}`, 196, finalY, { align: 'right' });

  let curY = finalY + 6;
  doc.text('GST Amount (CGST + SGST):', startRight, curY);
  doc.text(`${currency}${order.totalGst.toFixed(2)}`, 196, curY, { align: 'right' });
  curY += 6;

  // Custom total rows if configured
  if (billFormat?.customTotalRows) {
    billFormat.customTotalRows.filter(r => r.enabled).forEach(r => {
      doc.text(`${r.label}:`, startRight, curY);
      doc.text(`${r.amount >= 0 ? '+' : '-'}${currency}${Math.abs(r.amount).toFixed(2)}`, 196, curY, { align: 'right' });
      curY += 6;
    });
  }

  const grandTotalValue = (billFormat?.overrideTotalEnabled && billFormat.overrideTotalAmount !== undefined)
    ? billFormat.overrideTotalAmount
    : order.grandTotal;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(241, 245, 249);
  doc.rect(startRight - 2, curY, 65, 9, 'F');
  doc.text(labels?.netPayableLabel || 'Grand Total:', startRight, curY + 6);
  doc.text(`${currency}${grandTotalValue.toFixed(2)}`, 196, curY + 6, { align: 'right' });
  curY += 12;

  if (order.totalDiscount > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(labels?.discountLabel || 'TOTAL SAVINGS:', startRight, curY);
    doc.text(`${currency}${order.totalDiscount.toFixed(2)}`, 196, curY, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    curY += 6;
  }

  // Policy Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(footerText, 105, 278, { align: 'center' });
  if (returnPolicy) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Return Policy: ${returnPolicy}`, 105, 283, { align: 'center' });
  }

  doc.save(`${order.invoiceNumber}.pdf`);
}

export function exportOrdersToCsv(orders: Order[]) {
  const data = orders.map((o) => ({
    'Invoice No': o.invoiceNumber,
    'Date': new Date(o.createdAt).toLocaleString('en-IN'),
    'Cashier': o.cashier.name,
    'Customer Name': o.customer?.name || 'Walk-in Customer',
    'Customer Phone': o.customer?.phone || '',
    'Items Count': o.totalItems,
    'Total Qty': o.totalQuantity,
    'Subtotal': o.subtotal,
    'Discount': o.totalDiscount,
    'GST': o.totalGst,
    'Grand Total': o.grandTotal,
    'Net Profit': o.netProfit,
    'Payment Method': o.paymentMethod.toUpperCase(),
    'Status': o.status.toUpperCase(),
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `supermarket_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
