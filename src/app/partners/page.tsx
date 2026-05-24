import Link from 'next/link';

export default function PartnersPage() {
  return (
    <>
      {/* Hero */}
      <div
        className="px-7 py-16"
        style={{ background: 'var(--gray-900)', color: '#fff' }}
      >
        <div className="mx-auto max-w-2xl">
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}
          >
            Partnership
          </p>
          <h1 className="mb-4 text-3xl font-bold leading-snug">
            Build the future of<br />prediction markets in Nigeria
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            PredictWaves is the Naira-native gateway to Polymarket — the world&apos;s largest
            prediction market. We&apos;re looking for fintech partners, on-ramp providers,
            and distribution channels to bring this product to millions of Nigerians.
          </p>
        </div>
      </div>

      {/* Integration approach */}
      <div className="px-7 py-12">
        <div className="mx-auto max-w-2xl flex flex-col gap-8">

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>
              Our integration approach
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>
              PredictWaves sits on top of Polymarket&apos;s CLOB (Central Limit Order Book) via their
              public API. Users get embedded Polygon wallets (via Privy) so there&apos;s no crypto
              knowledge required. We display prices in Naira and partner with Naira on-ramp
              providers so users can fund with bank transfer, USSD, or mobile money.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>
              What we&apos;re looking for
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>
              We are actively seeking partners across three areas: (1) <strong>on-ramp liquidity</strong> —
              fintechs and P2P desks that can move Naira into USDC at competitive rates;
              (2) <strong>distribution</strong> — sports betting platforms, financial news outlets, and
              community apps with existing Nigerian audiences; and (3) <strong>white-label</strong> —
              organisations that want to deploy a branded prediction market experience for their users.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>
              The partnership ask
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-600)' }}>
              We are pre-revenue and moving fast. We offer equity-free revenue share agreements for
              on-ramp partners, co-marketing for distribution partners, and a fixed integration fee
              plus ongoing royalties for white-label deployments. All integrations are API-first and
              can be live within two weeks.
            </p>
          </section>

          {/* CTA */}
          <div
            className="rounded-2xl border p-8 flex flex-col gap-4"
            style={{ borderColor: 'var(--green-200)', background: 'var(--green-50)' }}
          >
            <p className="text-base font-semibold" style={{ color: 'var(--green-900)' }}>
              Ready to explore a partnership?
            </p>
            <p className="text-sm" style={{ color: 'var(--green-700)' }}>
              Send us an email with a brief description of your organisation and the partnership
              type you&apos;re interested in. We typically respond within 48 hours.
            </p>
            <Link
              href="mailto:partnerships@predictwaves.com"
              className="inline-flex h-10 w-fit items-center rounded-full px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--green-600)' }}
            >
              partnerships@predictwaves.com →
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
