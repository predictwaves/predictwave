import { TransactionHistory } from '@/components/transaction-history';
import { getCachedRate } from '@/lib/fx';

export default async function HistoryPage() {
  const fxData = await getCachedRate('NGN/USD').catch(() => null);
  const fxRate = fxData?.rate ?? 1700;

  return (
    <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Transaction history</h1>
      <TransactionHistory fxRate={fxRate} />
    </main>
  );
}
