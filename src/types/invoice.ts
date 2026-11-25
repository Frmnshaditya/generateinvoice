export type PackageId = 'basic' | 'standard' | 'premium' | 'exclusive';

export interface PackageOption {
  id: PackageId;
  name: string;
  price: number;
}

export type PaymentMethod = 'Transfer Bank' | 'Tunai' | 'QRIS' | 'Lainnya';

export type DpOption = '30' | '50' | '70' | 'manual';

export type PaymentStatus =
  | 'BELUM DIBAYAR'
  | 'PEMBAYARAN SEBAGIAN'
  | 'LUNAS'
  | 'MELEBIHI TAGIHAN';

export interface InvoiceFormData {
  customerName: string;
  coupleName: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceNumber: string;
  startingSequence: number;
  isManualInvoiceNumber: boolean;
  selectedPackageId: PackageId;
  packagePrice: number;
  paymentMethod: PaymentMethod;
  customPaymentMethod: string;
  dpOption: DpOption;
  firstPayment: number;
  secondPayment: number;
}

export interface InvoiceCalculations {
  totalPaid: number;
  remainingBalance: number;
  status: PaymentStatus;
  isOverpaid: boolean;
  overpaidAmount: number;
}

export interface ValidationErrors {
  customerName?: string;
  coupleName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  packagePrice?: string;
  overpaid?: string;
}
