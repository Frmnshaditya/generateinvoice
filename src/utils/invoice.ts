import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  InvoiceCalculations,
  InvoiceFormData,
  PackageOption,
  PaymentStatus,
  ValidationErrors,
} from '../types/invoice';

export const DEFAULT_PACKAGES: PackageOption[] = [
  { id: 'basic', name: 'Basic Invitation', price: 50000 },
  { id: 'standard', name: 'Standard Invitation', price: 100000 },
  { id: 'premium', name: 'Premium Invitation', price: 150000 },
  { id: 'exclusive', name: 'Exclusive Invitation', price: 250000 },
];

export const PAYMENT_METHODS = [
  'Transfer Bank',
  'Tunai',
  'QRIS',
  'Lainnya',
] as const;

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatInvoiceNumber(sequence: number): string {
  const safeSeq = Math.max(1, Math.floor(Number.isFinite(sequence) ? sequence : 1));
  return `INV-NAFA-${String(safeSeq).padStart(3, '0')}`;
}

export function formatRupiah(amount: number): string {
  const safeAmount = Math.round(Number.isFinite(amount) ? amount : 0);
  if (safeAmount === 0) {
    return 'Rp0';
  }
  const formatted = new Intl.NumberFormat('id-ID').format(Math.abs(safeAmount));
  return safeAmount < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

export function parseCurrencyInput(raw: string): number {
  const digitsOnly = raw.replace(/[^0-9]/g, '');
  if (!digitsOnly) return 0;
  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatIndonesianDate(isoDate: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [yearStr, monthStr, dayStr] = parts;
  const year = Number.parseInt(yearStr, 10);
  const monthIndex = Number.parseInt(monthStr, 10) - 1;
  const day = Number.parseInt(dayStr, 10);

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(day) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return isoDate;
  }

  return `${day} ${months[monthIndex]} ${year}`;
}

export function calculateInvoice(
  packagePrice: number,
  firstPayment: number,
  secondPayment: number
): InvoiceCalculations {
  const safePrice = Math.max(0, Math.round(packagePrice || 0));
  const safeFirst = Math.max(0, Math.round(firstPayment || 0));
  const safeSecond = Math.max(0, Math.round(secondPayment || 0));

  const totalPaid = safeFirst + safeSecond;
  const isOverpaid = totalPaid > safePrice;
  const overpaidAmount = isOverpaid ? totalPaid - safePrice : 0;
  const remainingBalance = safePrice - totalPaid;

  let status: PaymentStatus = 'BELUM DIBAYAR';
  if (totalPaid === 0) {
    status = 'BELUM DIBAYAR';
  } else if (isOverpaid) {
    status = 'MELEBIHI TAGIHAN';
  } else if (safePrice > 0 && totalPaid === safePrice) {
    status = 'LUNAS';
  } else {
    status = 'PEMBAYARAN SEBAGIAN';
  }

  return {
    totalPaid,
    remainingBalance,
    status,
    isOverpaid,
    overpaidAmount,
  };
}

export function validateInvoiceForm(
  form: InvoiceFormData,
  calc: InvoiceCalculations
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!form.customerName.trim()) {
    errors.customerName = 'Nama pelanggan wajib diisi.';
  }
  if (!form.coupleName.trim()) {
    errors.coupleName = 'Nama mempelai wajib diisi.';
  }
  if (!form.invoiceNumber.trim()) {
    errors.invoiceNumber = 'Nomor invoice wajib diisi.';
  }
  if (!form.invoiceDate) {
    errors.invoiceDate = 'Tanggal invoice wajib dipilih.';
  }
  if (form.packagePrice <= 0) {
    errors.packagePrice = 'Harga paket harus lebih dari Rp 0.';
  }
  if (calc.isOverpaid) {
    errors.overpaid = `Total pembayaran melebihi harga paket sebesar ${formatRupiah(
      calc.overpaidAmount
    )}. Perbaiki nominal pembayaran sebelum membuat PDF.`;
  }

  return errors;
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-');
  return cleaned || 'INV-NAFA-001';
}

export async function generateInvoicePdf(
  element: HTMLElement,
  invoiceNumber: string
): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );

  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: 794,
    height: 1123,
    windowWidth: 794,
    windowHeight: 1123,
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  const safeFilename = `${sanitizeFilename(invoiceNumber)}.pdf`;
  pdf.save(safeFilename);
}
