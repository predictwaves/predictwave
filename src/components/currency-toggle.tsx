'use client';
import { useCurrencyStore } from '@/lib/currency-store';

export function CurrencyToggle() {
  const { displayCurrency, toggle } = useCurrencyStore();
  return (
    <fieldset
      className="inline-flex h-8 overflow-hidden rounded-full border"
      style={{ borderColor: 'var(--gray-200)', background: 'var(--gray-100)', padding: 0, margin: 0 }}
      aria-label="Currency display"
    >
      <button
        type="button"
        onClick={() => displayCurrency !== 'NGN' && toggle()}
        className="px-3 text-sm font-semibold transition-colors"
        style={
          displayCurrency === 'NGN'
            ? { background: 'var(--green-600)', color: '#fff', borderRadius: '999px' }
            : { background: 'transparent', color: 'var(--gray-500)' }
        }
        aria-pressed={displayCurrency === 'NGN'}
      >
        ₦ NGN
      </button>
      <button
        type="button"
        onClick={() => displayCurrency !== 'USD' && toggle()}
        className="px-3 text-sm font-semibold transition-colors"
        style={
          displayCurrency === 'USD'
            ? { background: 'var(--green-600)', color: '#fff', borderRadius: '999px' }
            : { background: 'transparent', color: 'var(--gray-500)' }
        }
        aria-pressed={displayCurrency === 'USD'}
      >
        $ USD
      </button>
    </fieldset>
  );
}
