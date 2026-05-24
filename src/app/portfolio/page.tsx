import { getCachedRate } from '@/lib/fx';
import { WalletHub } from '@/components/wallet-hub';

export default async function PortfolioPage() {
  const fxData = await getCachedRate('NGN/USD').catch(() => null);
  const fxRate = fxData?.rate ?? 1700;

  return (
    <>
      {/* Balance card */}
      <WalletHub fxRate={fxRate} />

      {/* Positions placeholder */}
      <section className="px-7 pb-8">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
        >
          Your positions
        </p>
        <div
          className="card-iridescent flex items-center justify-center rounded-xl py-12"
          style={{ borderStyle: 'dashed' }}
        >
          <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
            No open positions · Phase 4
          </p>
        </div>
      </section>

      {/* Activity placeholder */}
      <section className="px-7 pb-10">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
        >
          Recent activity
        </p>
        <div
          className="card-iridescent flex items-center justify-center rounded-xl py-12"
          style={{ borderStyle: 'dashed' }}
        >
          <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
            No recent activity · Phase 4
          </p>
        </div>
      </section>
    </>
  );
}
