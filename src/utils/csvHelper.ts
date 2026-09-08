import Papa from 'papaparse';
import { Product, CategoryType } from '../types';

export interface CsvProductRow {
  'Product Name'?: string;
  'Barcode'?: string;
  'Category'?: string;
  'Brand'?: string;
  'MRP'?: string | number;
  'Cost Price'?: string | number;
  'Selling Price'?: string | number;
  'Stock'?: string | number;
  'Unit'?: string;
  'GST %'?: string | number;
  'Supplier'?: string;
  'Description'?: string;
  'Expiry Date'?: string;
}

export interface CsvValidationResult {
  validRows: Partial<Product>[];
  invalidRows: { rowNumber: number; raw: Record<string, unknown>; error: string }[];
  duplicateBarcodes: string[];
}

export function parseProductCsv(file: File): Promise<CsvValidationResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows: Partial<Product>[] = [];
        const invalidRows: { rowNumber: number; raw: Record<string, unknown>; error: string }[] = [];
        const seenBarcodes = new Set<string>();
        const duplicateBarcodes: string[] = [];

        results.data.forEach((row, index) => {
          const rowNumber = index + 2; // account for header line
          
          // Map flexible keys
          const name = row['Product Name'] || row['name'] || row['ProductName'] || row['Title'];
          const barcode = (row['Barcode'] || row['barcode'] || row['UPC'] || row['EAN'] || '').trim();
          const category = (row['Category'] || row['category'] || 'Groceries & Staples') as CategoryType;
          const brand = row['Brand'] || row['brand'] || 'Generic';
          const mrp = parseFloat(String(row['MRP'] || row['mrp'] || '0'));
          const costPrice = parseFloat(String(row['Cost Price'] || row['costPrice'] || row['Cost'] || '0'));
          const sellingPrice = parseFloat(String(row['Selling Price'] || row['sellingPrice'] || row['Price'] || '0'));
          const stock = parseInt(String(row['Stock'] || row['stock'] || row['Quantity'] || '0'), 10);
          const unit = (row['Unit'] || row['unit'] || 'pcs') as Product['unit'];
          const gstRate = parseFloat(String(row['GST %'] || row['gstRate'] || row['GST'] || '0'));
          const supplier = row['Supplier'] || row['supplier'] || 'General Wholesaler';
          const description = row['Description'] || row['description'] || '';
          const expiryDate = row['Expiry Date'] || row['expiryDate'] || undefined;

          if (!name) {
            invalidRows.push({ rowNumber, raw: row, error: 'Product Name is missing' });
            return;
          }

          if (!barcode) {
            invalidRows.push({ rowNumber, raw: row, error: 'Barcode is missing' });
            return;
          }

          if (isNaN(sellingPrice) || sellingPrice <= 0) {
            invalidRows.push({ rowNumber, raw: row, error: 'Invalid or zero Selling Price' });
            return;
          }

          if (seenBarcodes.has(barcode)) {
            duplicateBarcodes.push(barcode);
          } else {
            seenBarcodes.add(barcode);
          }

          validRows.push({
            name,
            barcode,
            category,
            brand,
            mrp: isNaN(mrp) ? sellingPrice : mrp,
            costPrice: isNaN(costPrice) ? sellingPrice * 0.8 : costPrice,
            sellingPrice,
            stock: isNaN(stock) ? 0 : stock,
            minStockLevel: 10,
            unit,
            gstRate: isNaN(gstRate) ? 0 : gstRate,
            supplier,
            description,
            expiryDate,
            image: '',
          });
        });

        resolve({ validRows, invalidRows, duplicateBarcodes });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function exportProductsToCsv(products: Product[]) {
  const data = products.map((p) => ({
    'Product Name': p.name,
    'Barcode': p.barcode,
    'Category': p.category,
    'Brand': p.brand,
    'MRP': p.mrp,
    'Cost Price': p.costPrice,
    'Selling Price': p.sellingPrice,
    'Stock': p.stock,
    'Unit': p.unit,
    'GST %': p.gstRate,
    'Supplier': p.supplier,
    'Expiry Date': p.expiryDate || '',
    'Description': p.description,
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `supermarket_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadSampleCsvTemplate() {
  const sampleData = [
    {
      'Product Name': 'Fortune Sunlite Refined Sunflower Oil 1L',
      'Barcode': '8906007280014',
      'Category': 'Groceries & Staples',
      'Brand': 'Fortune',
      'MRP': 165,
      'Cost Price': 128,
      'Selling Price': 145,
      'Stock': 50,
      'Unit': 'L',
      'GST %': 5,
      'Supplier': 'ITC FMCG Supply Chain',
      'Expiry Date': '2027-04-15',
      'Description': 'Premium refined oil',
    },
    {
      'Product Name': 'Amul Pasteurised Butter 500g',
      'Barcode': '8901262010052',
      'Category': 'Dairy & Eggs',
      'Brand': 'Amul',
      'MRP': 275,
      'Cost Price': 228,
      'Selling Price': 260,
      'Stock': 30,
      'Unit': 'pack',
      'GST %': 12,
      'Supplier': 'Amul Dairy Federation',
      'Expiry Date': '2026-10-15',
      'Description': 'Salted butter pack',
    },
  ];

  const csv = Papa.unparse(sampleData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_product_import_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
