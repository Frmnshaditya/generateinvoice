import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { CurrencyInput } from './components/CurrencyInput';
import { InvoiceSheet } from './components/InvoiceSheet';
import { PreviewModal } from './components/PreviewModal';
import { ScaledInvoicePreview } from './components/ScaledInvoicePreview';
import {
  DpOption,
  InvoiceFormData,
  PackageId,
  PackageOption,
  PaymentMethod,
  ValidationErrors,
} from './types/invoice';
import {
  calculateInvoice,
  DEFAULT_PACKAGES,
  formatInvoiceNumber,
  formatRupiah,
  generateInvoicePdf,
  getTodayIsoDate,
  PAYMENT_METHODS,
  sanitizeFilename,
  validateInvoiceForm,
} from './utils/invoice';

function createInitialFormState(packages: PackageOption[]): InvoiceFormData {
  const defaultPkg = packages[0];
  return {
    customerName: '',
    coupleName: '',
    invoiceDate: getTodayIsoDate(),
    invoiceNumber: formatInvoiceNumber(1),
    startingSequence: 1,
    isManualInvoiceNumber: false,
    selectedPackageId: defaultPkg.id,
    packagePrice: defaultPkg.price,
    paymentMethod: 'Transfer Bank',
    customPaymentMethod: '',
    dpOption: 'manual',
    firstPayment: 0,
    secondPayment: 0,
  };
}

export default function App() {
  const [packages, setPackages] = useState<PackageOption[]>(DEFAULT_PACKAGES);
  const [form, setForm] = useState<InvoiceFormData>(() =>
    createInitialFormState(DEFAULT_PACKAGES)
  );
  const [showPriceConfig, setShowPriceConfig] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    downloadedFile?: string;
  } | null>(null);

  const exportSheetRef = useRef<HTMLDivElement>(null);
  const previewSectionRef = useRef<HTMLElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const coupleInputRef = useRef<HTMLInputElement>(null);
  const invoiceNumberInputRef = useRef<HTMLInputElement>(null);

  const selectedPackage = useMemo(() => {
    return (
      packages.find((pkg) => pkg.id === form.selectedPackageId) || packages[0]
    );
  }, [packages, form.selectedPackageId]);

  const calc = useMemo(
    () =>
      calculateInvoice(
        form.packagePrice,
        form.firstPayment,
        form.secondPayment
      ),
    [form.packagePrice, form.firstPayment, form.secondPayment]
  );

  const validationErrors: ValidationErrors = useMemo(
    () => validateInvoiceForm(form, calc),
    [form, calc]
  );

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const computeFirstPaymentForDp = (
    price: number,
    dp: DpOption,
    currentFirst: number
  ): number => {
    if (dp === 'manual') return currentFirst;
    const pct = Number.parseInt(dp, 10);
    return Math.round(price * (pct / 100));
  };

  const handleStartingSequenceChange = (rawVal: string) => {
    const digits = rawVal.replace(/[^0-9]/g, '');
    const nextSeq = digits ? Math.max(1, Number.parseInt(digits, 10)) : 1;
    setForm((prev) => ({
      ...prev,
      startingSequence: nextSeq,
      invoiceNumber: prev.isManualInvoiceNumber
        ? prev.invoiceNumber
        : formatInvoiceNumber(nextSeq),
    }));
  };

  const handleInvoiceNumberChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      invoiceNumber: val,
      isManualInvoiceNumber: true,
    }));
  };

  const handleUseSequenceNumber = () => {
    setForm((prev) => ({
      ...prev,
      isManualInvoiceNumber: false,
      invoiceNumber: formatInvoiceNumber(prev.startingSequence),
    }));
  };

  const handleNextSequence = () => {
    setForm((prev) => {
      const nextSeq = prev.startingSequence + 1;
      return {
        ...prev,
        startingSequence: nextSeq,
        isManualInvoiceNumber: false,
        invoiceNumber: formatInvoiceNumber(nextSeq),
      };
    });
    setPdfFeedback(null);
  };

  const handlePackageChange = (packageId: PackageId) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;
    setForm((prev) => ({
      ...prev,
      selectedPackageId: pkg.id,
      packagePrice: pkg.price,
      firstPayment: computeFirstPaymentForDp(
        pkg.price,
        prev.dpOption,
        prev.firstPayment
      ),
    }));
  };

  const handlePackagePriceChange = (newPrice: number) => {
    setForm((prev) => ({
      ...prev,
      packagePrice: newPrice,
      firstPayment: computeFirstPaymentForDp(
        newPrice,
        prev.dpOption,
        prev.firstPayment
      ),
    }));
  };

  const handleConfigPackagePriceChange = (
    packageId: PackageId,
    newPrice: number
  ) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === packageId ? { ...pkg, price: newPrice } : pkg
      )
    );
    if (form.selectedPackageId === packageId) {
      handlePackagePriceChange(newPrice);
    }
  };

  const handleDpOptionChange = (dp: DpOption) => {
    setForm((prev) => ({
      ...prev,
      dpOption: dp,
      firstPayment: computeFirstPaymentForDp(
        prev.packagePrice,
        dp,
        prev.firstPayment
      ),
    }));
  };

  const handleFirstPaymentChange = (amount: number) => {
    setForm((prev) => ({
      ...prev,
      dpOption: 'manual',
      firstPayment: amount,
    }));
  };

  const handleSecondPaymentChange = (amount: number) => {
    setForm((prev) => ({
      ...prev,
      secondPayment: amount,
    }));
  };

  const handlePayRemaining = () => {
    const remaining = Math.max(0, form.packagePrice - form.firstPayment);
    setForm((prev) => ({
      ...prev,
      secondPayment: remaining,
    }));
  };

  const handleResetForm = () => {
    setForm(createInitialFormState(packages));
    setShowErrors(false);
    setPdfFeedback(null);
  };

  const handleOpenPreview = () => {
    setIsPreviewModalOpen(true);
  };

  const handleGenerateAndDownloadPdf = async () => {
    setPdfFeedback(null);

    if (hasValidationErrors) {
      setShowErrors(true);
      setIsPreviewModalOpen(false);
      setTimeout(() => {
        if (validationErrors.customerName) {
          customerInputRef.current?.focus();
        } else if (validationErrors.coupleName) {
          coupleInputRef.current?.focus();
        } else if (validationErrors.invoiceNumber) {
          invoiceNumberInputRef.current?.focus();
        }
      }, 50);
      return;
    }

    if (!exportSheetRef.current) return;

    setIsGeneratingPdf(true);
    try {
      await generateInvoicePdf(exportSheetRef.current, form.invoiceNumber);
      const filename = `${sanitizeFilename(form.invoiceNumber)}.pdf`;
      setPdfFeedback({
        type: 'success',
        message: `PDF ${filename} berhasil dibuat dan diunduh.`,
        downloadedFile: filename,
      });
    } catch {
      setPdfFeedback({
        type: 'error',
        message:
          'Gagal membuat PDF. Silakan periksa kembali data input dan coba lagi.',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const statusBadgeClasses = (() => {
    switch (calc.status) {
      case 'LUNAS':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'PEMBAYARAN SEBAGIAN':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MELEBIHI TAGIHAN':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'BELUM DIBAYAR':
      default:
        return 'bg-white text-neutral-800 border-neutral-300';
    }
  })();

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/aistudio/NAFA_bulat_394a1e1b.png"
              alt="Logo NAFA"
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-neutral-950 sm:text-lg">
                NAFA INVOICE GENERATOR
              </h1>
              <p className="truncate text-xs font-medium text-neutral-600">
                Digital Invitation Bukti Pembayaran
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetForm}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Form</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPreview}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:border-neutral-900 hover:bg-neutral-50 hover:text-neutral-950 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateAndDownloadPdf}
              disabled={isGeneratingPdf || calc.isOverpaid}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {isGeneratingPdf ? 'Membuat PDF...' : 'Generate & Download PDF'}
              </span>
              <span className="sm:hidden">
                {isGeneratingPdf ? 'Membuat...' : 'Download PDF'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Workspace */}
      <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Column: Invoice Input Form */}
          <section
            aria-label="Form Input Invoice"
            className="lg:col-span-6 space-y-6"
          >
            <div className="rounded-xl border border-neutral-200 bg-white">
              {/* Form Intro Header */}
              <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-bold tracking-tight text-neutral-950">
                  Data Pembuatan Invoice
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Isi data pelanggan, paket undangan, dan nominal pembayaran
                  untuk menghasilkan bukti pembayaran PDF.
                </p>
              </div>

              <div className="divide-y divide-neutral-200">
                {/* 1. Informasi Pelanggan */}
                <div className="px-5 py-6 sm:px-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-950">
                      1. Informasi Pelanggan
                    </h3>
                    <span className="text-xs text-neutral-500">
                      * Wajib diisi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="customerName"
                        className="mb-1.5 block text-sm font-semibold text-neutral-900"
                      >
                        Nama Pelanggan <span className="text-neutral-950">*</span>
                      </label>
                      <input
                        ref={customerInputRef}
                        id="customerName"
                        type="text"
                        value={form.customerName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            customerName: e.target.value,
                          }))
                        }
                        placeholder="Contoh: Ibu Siti Aminah"
                        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 ${
                          showErrors && validationErrors.customerName
                            ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                            : 'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-950/15'
                        }`}
                      />
                      {showErrors && validationErrors.customerName && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {validationErrors.customerName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="coupleName"
                        className="mb-1.5 block text-sm font-semibold text-neutral-900"
                      >
                        Nama Mempelai <span className="text-neutral-950">*</span>
                      </label>
                      <input
                        ref={coupleInputRef}
                        id="coupleName"
                        type="text"
                        value={form.coupleName}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            coupleName: e.target.value,
                          }))
                        }
                        placeholder="Contoh: Rina & Dimas"
                        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-neutral-950 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 ${
                          showErrors && validationErrors.coupleName
                            ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                            : 'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-950/15'
                        }`}
                      />
                      {showErrors && validationErrors.coupleName && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {validationErrors.coupleName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="invoiceDate"
                        className="mb-1.5 block text-sm font-semibold text-neutral-900"
                      >
                        Tanggal Invoice
                      </label>
                      <input
                        id="invoiceDate"
                        type="date"
                        value={form.invoiceDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            invoiceDate: e.target.value,
                          }))
                        }
                        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-neutral-950 transition-colors focus:outline-none focus:ring-2 ${
                          showErrors && validationErrors.invoiceDate
                            ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                            : 'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-950/15'
                        }`}
                      />
                      {showErrors && validationErrors.invoiceDate && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {validationErrors.invoiceDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <label
                          htmlFor="invoiceNumber"
                          className="block text-sm font-semibold text-neutral-900"
                        >
                          Nomor Invoice
                        </label>
                        {form.isManualInvoiceNumber && (
                          <button
                            type="button"
                            onClick={handleUseSequenceNumber}
                            className="text-xs font-semibold text-neutral-900 underline underline-offset-2 hover:text-neutral-700 cursor-pointer"
                          >
                            Gunakan Urutan Otomatis
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={invoiceNumberInputRef}
                          id="invoiceNumber"
                          type="text"
                          value={form.invoiceNumber}
                          onChange={(e) =>
                            handleInvoiceNumberChange(e.target.value)
                          }
                          placeholder="INV-NAFA-001"
                          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 font-mono text-sm font-medium text-neutral-950 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 ${
                            showErrors && validationErrors.invoiceNumber
                              ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                              : 'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-950/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleNextSequence}
                          title="Naikkan nomor urutan invoice (+1)"
                          className="inline-flex h-[42px] shrink-0 items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 transition-colors hover:border-neutral-900 hover:bg-neutral-50 hover:text-neutral-950 cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>1</span>
                        </button>
                      </div>
                      {showErrors && validationErrors.invoiceNumber && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {validationErrors.invoiceNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Temporary Starting Sequence Control */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
                    <div className="text-xs text-neutral-600">
                      Nomor awal urutan sesi ini (tersimpan sementara selama
                      halaman terbuka)
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="startingSequence"
                        className="text-xs font-semibold text-neutral-700 whitespace-nowrap"
                      >
                        Urutan ke:
                      </label>
                      <input
                        id="startingSequence"
                        type="number"
                        min={1}
                        value={form.startingSequence}
                        onChange={(e) =>
                          handleStartingSequenceChange(e.target.value)
                        }
                        className="w-20 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-center font-mono text-xs font-semibold text-neutral-950 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/15"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pilihan Paket */}
                <div className="px-5 py-6 sm:px-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-950">
                      2. Pilihan Paket
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPriceConfig((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:text-neutral-950 cursor-pointer"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span>Atur Harga Paket</span>
                      {showPriceConfig ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="packageSelect"
                        className="mb-1.5 block text-sm font-semibold text-neutral-900"
                      >
                        Pilih Paket Undangan
                      </label>
                      <select
                        id="packageSelect"
                        value={form.selectedPackageId}
                        onChange={(e) =>
                          handlePackageChange(e.target.value as PackageId)
                        }
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-medium text-neutral-950 transition-colors focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/15"
                      >
                        {packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} ({formatRupiah(pkg.price)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="packagePrice"
                        className="mb-1.5 block text-sm font-semibold text-neutral-900"
                      >
                        Harga Paket
                      </label>
                      <CurrencyInput
                        id="packagePrice"
                        value={form.packagePrice}
                        onChange={handlePackagePriceChange}
                        hasError={showErrors && !!validationErrors.packagePrice}
                        ariaLabel="Harga Paket dalam Rupiah"
                      />
                      {showErrors && validationErrors.packagePrice && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {validationErrors.packagePrice}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Editable Package Price Configuration Panel */}
                  {showPriceConfig && (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-neutral-800">
                          Konfigurasi Harga Default Paket
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPackages(DEFAULT_PACKAGES);
                            const currentDefault = DEFAULT_PACKAGES.find(
                              (p) => p.id === form.selectedPackageId
                            );
                            if (currentDefault) {
                              handlePackagePriceChange(currentDefault.price);
                            }
                          }}
                          className="text-xs font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700 cursor-pointer"
                        >
                          Kembalikan Default
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {packages.map((pkg) => (
                          <div key={pkg.id}>
                            <label
                              htmlFor={`cfg-${pkg.id}`}
                              className="mb-1 block text-xs font-medium text-neutral-700"
                            >
                              {pkg.name}
                            </label>
                            <CurrencyInput
                              id={`cfg-${pkg.id}`}
                              value={pkg.price}
                              onChange={(val) =>
                                handleConfigPackagePriceChange(pkg.id, val)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Informasi Pembayaran */}
                <div className="px-5 py-6 sm:px-6 space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-950">
                    3. Informasi Pembayaran
                  </h3>

                  {/* Metode Pembayaran */}
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-neutral-900">
                      Metode Pembayaran
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {PAYMENT_METHODS.map((method: PaymentMethod) => {
                        const active = form.paymentMethod === method;
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                paymentMethod: method,
                              }))
                            }
                            className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                              active
                                ? 'border-neutral-950 bg-neutral-950 text-white'
                                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50'
                            }`}
                          >
                            {method}
                          </button>
                        );
                      })}
                    </div>

                    {form.paymentMethod === 'Lainnya' && (
                      <div className="mt-3">
                        <label
                          htmlFor="customPaymentMethod"
                          className="mb-1 block text-xs font-medium text-neutral-700"
                        >
                          Detail Metode Pembayaran (Opsional)
                        </label>
                        <input
                          id="customPaymentMethod"
                          type="text"
                          value={form.customPaymentMethod}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              customPaymentMethod: e.target.value,
                            }))
                          }
                          placeholder="Contoh: GoPay / ShopeePay / OVO"
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/15"
                        />
                      </div>
                    )}
                  </div>

                  {/* Pilihan DP */}
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-neutral-900">
                      Pilihan DP (Pembayaran Pertama)
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(
                        [
                          { id: '30', label: 'DP 30%' },
                          { id: '50', label: 'DP 50%' },
                          { id: '70', label: 'DP 70%' },
                          { id: 'manual', label: 'Nominal Manual' },
                        ] as const
                      ).map((opt) => {
                        const active = form.dpOption === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleDpOptionChange(opt.id)}
                            className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                              active
                                ? 'border-neutral-950 bg-white text-neutral-950 ring-1 ring-neutral-950'
                                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nominal Pembayaran Pertama & Kedua */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="firstPayment"
                        className="mb-1.5 block text-sm font-semibold text-neutral-900"
                      >
                        Pembayaran Pertama (DP)
                      </label>
                      <CurrencyInput
                        id="firstPayment"
                        value={form.firstPayment}
                        onChange={handleFirstPaymentChange}
                        hasError={calc.isOverpaid}
                        ariaLabel="Nominal Pembayaran Pertama"
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <label
                          htmlFor="secondPayment"
                          className="block text-sm font-semibold text-neutral-900"
                        >
                          Pembayaran Kedua (Pelunasan)
                        </label>
                        {form.packagePrice > form.firstPayment && (
                          <button
                            type="button"
                            onClick={handlePayRemaining}
                            className="text-xs font-semibold text-neutral-900 underline underline-offset-2 hover:text-neutral-700 cursor-pointer whitespace-nowrap"
                          >
                            Lunasi Sisa
                          </button>
                        )}
                      </div>
                      <CurrencyInput
                        id="secondPayment"
                        value={form.secondPayment}
                        onChange={handleSecondPaymentChange}
                        hasError={calc.isOverpaid}
                        ariaLabel="Nominal Pembayaran Kedua"
                      />
                    </div>
                  </div>

                  {/* Ringkasan Perhitungan Live */}
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-xs font-medium text-neutral-500">
                          Total Dibayarkan
                        </div>
                        <div className="mt-1 font-mono text-base font-bold tabular-nums text-neutral-950">
                          {formatRupiah(calc.totalPaid)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-neutral-500">
                          Sisa Pembayaran
                        </div>
                        <div
                          className={`mt-1 font-mono text-base font-bold tabular-nums ${
                            calc.isOverpaid
                              ? 'text-red-600'
                              : calc.remainingBalance === 0 &&
                                  form.packagePrice > 0
                                ? 'text-emerald-700'
                                : 'text-neutral-950'
                          }`}
                        >
                          {formatRupiah(calc.remainingBalance)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-neutral-500">
                          Status Pembayaran
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-bold tracking-wide ${statusBadgeClasses}`}
                          >
                            {calc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overpayment Warning */}
                  {calc.isOverpaid && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <div>
                        <p className="font-semibold">
                          Total pembayaran melebihi harga paket sebesar{' '}
                          {formatRupiah(calc.overpaidAmount)}.
                        </p>
                        <p className="mt-0.5 text-xs text-red-700">
                          Kurangi nominal pembayaran pertama atau kedua sebelum
                          membuat PDF.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Validation Summary on Submit Attempt */}
                  {showErrors && hasValidationErrors && !calc.isOverpaid && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span>
                        Lengkapi semua data wajib (Nama pelanggan, Nama
                        mempelai, Nomor invoice, dan Harga paket) sebelum
                        mengunduh PDF.
                      </span>
                    </div>
                  )}

                  {/* PDF Action Feedback */}
                  {pdfFeedback && (
                    <div
                      role="status"
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-xs ${
                        pdfFeedback.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-red-200 bg-red-50 text-red-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {pdfFeedback.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                        )}
                        <span>{pdfFeedback.message}</span>
                      </div>
                      {pdfFeedback.type === 'success' && (
                        <button
                          type="button"
                          onClick={handleNextSequence}
                          className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950 cursor-pointer"
                        >
                          Siapkan Nomor Berikutnya (
                          {formatInvoiceNumber(form.startingSequence + 1)})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Action Buttons */}
                <div className="flex flex-col gap-3 bg-neutral-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 rounded-b-xl">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleOpenPreview}
                      className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:border-neutral-900 hover:bg-neutral-50 hover:text-neutral-950 whitespace-nowrap cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Preview Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Reset Form</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAndDownloadPdf}
                    disabled={isGeneratingPdf || calc.isOverpaid}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>
                      {isGeneratingPdf
                        ? 'Membuat PDF...'
                        : 'Generate & Download PDF'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Live A4 Invoice Preview */}
          <section
            ref={previewSectionRef}
            aria-label="Preview Invoice Langsung"
            className="lg:col-span-6 lg:sticky lg:top-[84px]"
          >
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
              <div className="mb-3.5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">
                    Preview Invoice Langsung (A4)
                  </h2>
                  <p className="text-xs text-neutral-500">
                    File unduhan:{' '}
                    <span className="font-mono font-medium text-neutral-700">
                      {sanitizeFilename(form.invoiceNumber)}.pdf
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-950 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Perbesar</span>
                </button>
              </div>

              <ScaledInvoicePreview
                form={form}
                selectedPackage={selectedPackage}
                calc={calc}
              />
            </div>
          </section>
        </div>
      </main>

      {/* Hidden Full-Resolution A4 Export Sheet (prevents cropping on mobile/narrow viewports) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <InvoiceSheet
          sheetRef={exportSheetRef}
          form={form}
          selectedPackage={selectedPackage}
          calc={calc}
        />
      </div>

      {/* Full-Size A4 Preview Modal */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onDownloadPdf={handleGenerateAndDownloadPdf}
        isGeneratingPdf={isGeneratingPdf}
        canDownload={!calc.isOverpaid}
        form={form}
        selectedPackage={selectedPackage}
        calc={calc}
      />
    </div>
  );
}
