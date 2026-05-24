'use client';
import { useCurrency } from '@/lib/currency-context';

export function PriceToggle() {
  const { currency, toggle } = useCurrency();
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium transition-colors"
      style={{
        borderColor: 'var(--green-200)',
        background: currency === 'NGN' ? 'var(--green-600)' : 'var(--gray-100)',
        color: currency === 'NGN' ? '#fff' : 'var(--gray-700)',
      }}
      aria-label={`Currency: ${currency}. Click to switch.`}
    >
      <span
        className="mr-1"
        style={{ color: currency === 'NGN' ? '#fff' : 'var(--gray-400)' }}
      >
        ₦
      </span>
      NGN /
      <span
        className="ml-1"
        style={{ color: currency === 'USD' ? 'var(--gray-700)' : 'rgba(255,255,255,0.7)' }}
      >
        $ USD
      </span>
    </button>
  );
}

export { useCurrency };
