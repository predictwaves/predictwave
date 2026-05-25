import { getCachedRate } from '@/lib/fx';
import { PositionsList } from '@/components/positions-list';
import { WalletHub } from '@/components/wallet-hub';

export default async function PortfolioPage() {
  const fxData = await getCachedRate('NGN/USD').catch(() => null);
  const fxRate = fxData?.rate ?? 1700;

  return (
    <>
      <WalletHub fxRate={fxRate} />

      <section className="px-7 pb-8">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
        >
          Your positions
        </p>
        <PositionsList fxRate={fxRate} />
      </section>

      <section className="px-7 pb-10">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--gray-400)', letterSpacing: '0.1em' }}
        >
          Recent activity
        </p>
        <div
          className="flex items-center justify-center rounded-xl border py-12"
          style={{ borderColor: 'var(--gray-200)', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
            No recent activity · Phase 4
          </p>
        </div>
      </section>
    </>
  );
}
