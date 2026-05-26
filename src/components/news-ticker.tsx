'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface TickerItem {
  conditionId: string;
  question: string;
  category: string | null;
  yesProbability: number;
}

const CATEGORY_ICON: Record<string, string> = {
  politics: '🏛️',
  sports: '⚽',
  crypto: '₿',
  nigeria: '🇳🇬',
  world: '🌍',
};

function clampQuestion(q: string): string {
  return q.length > 60 ? `${q.slice(0, 59)}…` : q;
}

function useTicker() {
  return useQuery<{ items: TickerItem[] }>({
    queryKey: ['ticker'],
    queryFn: async () => {
      const res = await fetch('/api/markets/ticker');
      if (!res.ok) return { items: [] };
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

function TickerEntry({ item }: { item: TickerItem }) {
  const pct = Math.round(item.yesProbability * 100);
  const icon = CATEGORY_ICON[item.category ?? 'world'] ?? CATEGORY_ICON.world;
  return (
    <Link
      href={`/markets/${item.conditionId}`}
      className="ticker-item inline-flex items-center gap-1.5"
      style={{ color: 'var(--gray-700)' }}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{clampQuestion(item.question)}</span>
      <span className="tabular-nums" style={{ color: 'var(--gray-500)' }}>
        · YES {pct}%
      </span>
    </Link>
  );
}

export function NewsTicker() {
  const { data } = useTicker();
  const items = data?.items ?? [];

  return (
    <div
      className="ticker-strip sticky z-40 overflow-hidden"
      style={{
        top: '56px',
        height: '36px',
        background: 'var(--green-50)',
        borderTop: '1px solid var(--green-100)',
        borderBottom: '1px solid var(--green-100)',
      }}
    >
      {items.length > 0 && (
        <div className="ticker-track">
          {/* Two copies (distinct key prefixes) keep the loop populated end-to-end. */}
          {(['a', 'b'] as const).map((copy) =>
            items.map((item) => (
              <TickerEntry key={`${copy}-${item.conditionId}`} item={item} />
            )),
          )}
        </div>
      )}
    </div>
  );
}
