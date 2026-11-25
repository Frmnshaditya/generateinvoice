import React, { useEffect } from 'react';
import { Download, X } from 'lucide-react';
import {
  InvoiceCalculations,
  InvoiceFormData,
  PackageOption,
} from '../types/invoice';
import { ScaledInvoicePreview } from './ScaledInvoicePreview';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
  isGeneratingPdf: boolean;
  canDownload: boolean;
  form: InvoiceFormData;
  selectedPackage: PackageOption;
  calc: InvoiceCalculations;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  onDownloadPdf,
  isGeneratingPdf,
  canDownload,
  form,
  selectedPackage,
  calc,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-neutral-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Preview Invoice A4"
      onClick={onClose}
    >
      {/* Modal Header */}
      <div
        className="flex items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950 px-4 py-3 text-white sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight truncate">
            Preview Invoice A4 ·{' '}
            <span className="font-mono text-white">
              {form.invoiceNumber.trim() || 'INV-NAFA-001'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf || !canDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-neutral-950 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>
              {isGeneratingPdf ? 'Membuat PDF...' : 'Generate & Download PDF'}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Preview"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable A4 Sheet Container */}
      <div
        className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8"
        onClick={onClose}
      >
        <div
          className="mx-auto max-w-[794px]"
          onClick={(e) => e.stopPropagation()}
        >
          <ScaledInvoicePreview
            form={form}
            selectedPackage={selectedPackage}
            calc={calc}
          />
        </div>
      </div>
    </div>
  );
};
