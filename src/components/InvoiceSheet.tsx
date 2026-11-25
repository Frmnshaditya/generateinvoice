import React from 'react';
import {
  InvoiceCalculations,
  InvoiceFormData,
  PackageOption,
} from '../types/invoice';
import { formatIndonesianDate, formatRupiah } from '../utils/invoice';

interface InvoiceSheetProps {
  form: InvoiceFormData;
  selectedPackage: PackageOption;
  calc: InvoiceCalculations;
  sheetRef?: React.Ref<HTMLDivElement>;
}

export const NAFA_LOGO_URL = '/assets/aistudio/NAFA_bulat_394a1e1b.png';

export const InvoiceSheet: React.FC<InvoiceSheetProps> = ({
  form,
  selectedPackage,
  calc,
  sheetRef,
}) => {
  const displayMethod =
    form.paymentMethod === 'Lainnya' && form.customPaymentMethod.trim()
      ? form.customPaymentMethod.trim()
      : form.paymentMethod;

  const displayCustomer = form.customerName.trim() || '-';
  const displayCouple = form.coupleName.trim() || '-';
  const displayInvoiceNumber = form.invoiceNumber.trim() || 'INV-NAFA-001';
  const displayDate = formatIndonesianDate(form.invoiceDate);

  const dpLabel =
    form.dpOption === 'manual'
      ? 'Pembayaran DP'
      : `Pembayaran DP (${form.dpOption}%)`;

  const statusColor =
    calc.status === 'MELEBIHI TAGIHAN' ? '#DC2626' : '#0A0A0A';

  return (
    <div
      ref={sheetRef}
      style={{
        width: '794px',
        height: '1123px',
        backgroundColor: '#FFFFFF',
        color: '#111827',
        fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '54px 72px 48px 72px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Centered Header with Circular Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <img
          src={NAFA_LOGO_URL}
          alt="Logo NAFA Digital Invitation"
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '9999px',
            objectFit: 'cover',
            display: 'block',
            marginBottom: '12px',
          }}
        />
        <h1
          style={{
            margin: 0,
            fontSize: '23px',
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: '#0A0A0A',
            lineHeight: 1.2,
          }}
        >
          NAFA INVOICE
        </h1>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '10.5px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: '#374151',
            textTransform: 'uppercase',
          }}
        >
          DIGITAL INVITATION BUKTI PEMBAYARAN
        </p>
      </div>

      {/* Top Divider */}
      <div
        style={{
          marginTop: '20px',
          borderTop: '1px solid #1F2937',
          width: '100%',
        }}
      />

      {/* Status Pembayaran Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '14px',
          fontSize: '12.5px',
        }}
      >
        <span
          style={{
            fontWeight: 500,
            color: '#111827',
            letterSpacing: '0.02em',
          }}
        >
          STATUS PEMBAYARAN
        </span>
        <span
          style={{
            fontWeight: 700,
            color: statusColor,
            letterSpacing: '0.02em',
          }}
        >
          {calc.status}
        </span>
      </div>

      {/* 3-Column Metadata: NOMOR INVOICE | TANGGAL | PAKET */}
      <div
        style={{
          marginTop: '34px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}
          >
            NOMOR INVOICE
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#0A0A0A',
            }}
          >
            {displayInvoiceNumber}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}
          >
            TANGGAL
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#0A0A0A',
            }}
          >
            {displayDate}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '4px',
              textTransform: 'uppercase',
            }}
          >
            PAKET
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#0A0A0A',
            }}
          >
            {selectedPackage.name}
          </div>
        </div>
      </div>

      {/* Section: INFORMASI PELANGGAN */}
      <div style={{ marginTop: '32px' }}>
        <h2
          style={{
            margin: '0 0 18px 0',
            fontSize: '12.5px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: '#0A0A0A',
            textTransform: 'uppercase',
          }}
        >
          INFORMASI PELANGGAN
        </h2>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '24px',
            paddingBottom: '16px',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: '#1F2937', flexShrink: 0 }}>
            Nama pelanggan
          </span>
          <span
            style={{
              fontWeight: 700,
              color: form.customerName.trim() ? '#0A0A0A' : '#9CA3AF',
              textAlign: 'right',
            }}
          >
            {form.customerName.trim() ? displayCustomer : 'Belum diisi'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '24px',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: '#1F2937', flexShrink: 0 }}>
            Nama mempelai
          </span>
          <span
            style={{
              fontWeight: 700,
              color: form.coupleName.trim() ? '#0A0A0A' : '#9CA3AF',
              textAlign: 'right',
            }}
          >
            {form.coupleName.trim() ? displayCouple : 'Belum diisi'}
          </span>
        </div>
      </div>

      {/* Section: RINCIAN TRANSAKSI */}
      <div style={{ marginTop: '36px' }}>
        <h2
          style={{
            margin: '0 0 14px 0',
            fontSize: '12.5px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: '#0A0A0A',
            textTransform: 'uppercase',
          }}
        >
          RINCIAN TRANSAKSI
        </h2>

        {/* Column Headers */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '16px',
            fontSize: '11.5px',
            fontWeight: 500,
            color: '#374151',
            letterSpacing: '0.02em',
          }}
        >
          <span>DESKRIPSI</span>
          <span>JUMLAH</span>
        </div>

        {/* Item: Paket */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '18px',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: '#1F2937' }}>Paket {selectedPackage.name}</span>
          <span
            style={{
              fontWeight: 700,
              color: '#0A0A0A',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatRupiah(form.packagePrice)}
          </span>
        </div>

        {/* Item: Pembayaran DP */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '18px',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: '#1F2937' }}>{dpLabel}</span>
          <span
            style={{
              fontWeight: 500,
              color: '#111827',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatRupiah(form.firstPayment)}
          </span>
        </div>

        {/* Item: Pelunasan */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '26px',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: '#1F2937' }}>Pelunasan</span>
          <span
            style={{
              fontWeight: 500,
              color: '#111827',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatRupiah(form.secondPayment)}
          </span>
        </div>

        {/* Summary: TOTAL DIBAYARKAN */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '26px',
          }}
        >
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#0A0A0A',
              letterSpacing: '0.01em',
            }}
          >
            TOTAL DIBAYARKAN
          </span>
          <span
            style={{
              fontSize: '21px',
              fontWeight: 700,
              color: '#0A0A0A',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            {formatRupiah(calc.totalPaid)}
          </span>
        </div>

        {/* Summary: Sisa pembayaran */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: '#1F2937' }}>Sisa pembayaran</span>
          <span
            style={{
              fontWeight: 700,
              color: calc.isOverpaid ? '#DC2626' : '#0A0A0A',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatRupiah(calc.remainingBalance)}
          </span>
        </div>
      </div>

      {/* Section: INFORMASI PEMBAYARAN */}
      <div style={{ marginTop: '30px' }}>
        <h2
          style={{
            margin: '0 0 18px 0',
            fontSize: '12.5px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: '#0A0A0A',
            textTransform: 'uppercase',
          }}
        >
          INFORMASI PEMBAYARAN
        </h2>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '14px',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: '#1F2937' }}>Metode pembayaran</span>
          <span style={{ fontWeight: 700, color: '#0A0A0A' }}>
            {displayMethod}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '14px',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: '#1F2937' }}>Pembayaran pertama</span>
          <span
            style={{
              fontWeight: 500,
              color: '#111827',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatRupiah(form.firstPayment)}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12.5px',
          }}
        >
          <span style={{ color: '#1F2937' }}>Pembayaran kedua</span>
          <span
            style={{
              fontWeight: 500,
              color: '#111827',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatRupiah(form.secondPayment)}
          </span>
        </div>
      </div>

      {/* Footer Section */}
      <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <div
          style={{
            borderTop: '1px solid #9CA3AF',
            marginBottom: '14px',
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: '#111827',
              marginBottom: '4px',
            }}
          >
            TERIMA KASIH
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              lineHeight: 1.55,
              color: '#1F2937',
            }}
          >
            Terima kasih telah mempercayakan momen spesial Anda kepada NAFA
            Digital Invitation.
          </p>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '11px',
              lineHeight: 1.55,
              color: '#1F2937',
            }}
          >
            Your Special Moment, Our Digital Creation.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '9.5px',
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: '#1F2937',
            paddingBottom: '12px',
          }}
        >
          <span>NAFA DIGITAL INVITATION</span>
          <span>INVOICE / PAYMENT RECEIPT</span>
        </div>

        <div
          style={{
            borderTop: '1px solid #D1D5DB',
            width: '100%',
          }}
        />
      </div>
    </div>
  );
};
