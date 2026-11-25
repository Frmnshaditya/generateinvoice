import React from 'react';
import { parseCurrencyInput } from '../utils/invoice';

interface CurrencyInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  ariaLabel?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  hasError = false,
  ariaLabel,
}) => {
  const formattedDisplay =
    value > 0 ? new Intl.NumberFormat('id-ID').format(value) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = parseCurrencyInput(e.target.value);
    onChange(numeric);
  };

  return (
    <div className="relative flex items-center">
      <span
        className={`pointer-events-none absolute left-3.5 text-sm font-medium select-none ${
          disabled ? 'text-neutral-400' : 'text-neutral-500'
        }`}
      >
        Rp
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={formattedDisplay}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`w-full rounded-lg border bg-white py-2.5 pr-3.5 pl-10 text-sm font-medium font-mono tabular-nums text-neutral-950 transition-colors focus:outline-none focus:ring-2 ${
          hasError
            ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
            : 'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-950/15'
        } disabled:bg-neutral-100 disabled:text-neutral-500`}
      />
    </div>
  );
};
