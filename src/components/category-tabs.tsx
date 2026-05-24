'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Politics', value: 'politics' },
  { label: 'Sports', value: 'sports' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Nigeria', value: 'nigeria' },
  { label: 'World', value: 'world' },
] as const;

export function CategoryTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('category') ?? '';

  function setCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    router.push(`/markets?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {TABS.map((tab) => {
        const active = tab.value === current;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCategory(tab.value)}
            className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            style={
              active
                ? { background: 'var(--green-600)', color: '#fff' }
                : { background: 'var(--gray-100)', color: 'var(--gray-600)' }
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
