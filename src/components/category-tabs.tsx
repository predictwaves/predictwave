'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('category') ?? '';

  // Push to whichever page the tabs are rendered on (/ or /markets)
  const base = pathname === '/' ? '/' : '/markets';

  function setCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    const qs = params.toString();
    router.push(qs ? `${base}?${qs}` : base);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {TABS.map((tab) => {
        const active = tab.value === current;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCategory(tab.value)}
            className="shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
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
