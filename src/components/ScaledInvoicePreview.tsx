import React, { useEffect, useRef, useState } from 'react';
import {
  InvoiceCalculations,
  InvoiceFormData,
  PackageOption,
} from '../types/invoice';
import { InvoiceSheet } from './InvoiceSheet';

interface ScaledInvoicePreviewProps {
  form: InvoiceFormData;
  selectedPackage: PackageOption;
  calc: InvoiceCalculations;
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

export const ScaledInvoicePreview: React.FC<ScaledInvoicePreviewProps> = ({
  form,
  selectedPackage,
  calc,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.7);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const availableWidth = el.clientWidth;
      if (availableWidth > 0) {
        const nextScale = Math.min(1, availableWidth / A4_WIDTH);
        setScale(nextScale);
      }
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const scaledHeight = Math.round(A4_HEIGHT * scale);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div
        className="mx-auto border border-neutral-200 bg-white shadow-sm rounded-sm overflow-hidden"
        style={{
          width: `${Math.round(A4_WIDTH * scale)}px`,
          height: `${scaledHeight}px`,
        }}
      >
        <div
          style={{
            width: `${A4_WIDTH}px`,
            height: `${A4_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <InvoiceSheet
            form={form}
            selectedPackage={selectedPackage}
            calc={calc}
          />
        </div>
      </div>
    </div>
  );
};
