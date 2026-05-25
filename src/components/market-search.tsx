'use client';
import { Command, CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface SearchResult {
  conditionId: string;
  question: string;
  category: string | null;
}

interface MarketSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MarketSearch({ open: controlledOpen, onOpenChange }: MarketSearchProps = {}) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const handleOpenChange = onOpenChange ?? setLocalOpen;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  // Stable ref so the Cmd+K effect never needs to re-register
  const handleOpenRef = useRef(handleOpenChange);
  handleOpenRef.current = handleOpenChange;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenRef.current(true);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/markets/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<{ markets?: SearchResult[] }>)
      .then((d) => setResults(Array.isArray(d?.markets) ? d.markets : []))
      .catch(() => setResults([]));
    return () => controller.abort();
  }, [query]);

  function select(conditionId: string) {
    handleOpenChange(false);
    setQuery('');
    setResults([]);
    router.push(`/markets/${conditionId}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <Command className="rounded-xl border shadow-lg" style={{ background: '#fff', borderColor: 'var(--gray-200)' }}>
        <CommandInput
          placeholder="Search markets…"
          value={query}
          onValueChange={setQuery}
          className="border-b px-4 py-3 text-sm outline-none"
          style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-900)' }}
        />
        <CommandList className="max-h-72 overflow-y-auto p-2">
          <CommandEmpty className="px-4 py-6 text-center text-sm" style={{ color: 'var(--gray-400)' }}>
            {query ? 'No markets found.' : 'Type to search markets…'}
          </CommandEmpty>
          {results.map((r) => (
            <CommandItem
              key={r.conditionId}
              value={r.conditionId}
              onSelect={() => select(r.conditionId)}
              className="flex cursor-pointer flex-col gap-0.5 rounded-lg px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--gray-900)' }}
            >
              <span className="line-clamp-1 font-medium">{r.question}</span>
              {r.category && (
                <span className="text-xs" style={{ color: 'var(--gray-400)' }}>
                  {r.category}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
