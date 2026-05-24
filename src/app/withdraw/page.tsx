export default function WithdrawPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Withdraw</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--gray-500)' }}>
          Move USDC from your wallet to an external address.
        </p>
      </div>
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16 text-center"
        style={{ border: '1px dashed var(--gray-200)', background: 'var(--gray-50)' }}
      >
        <svg aria-hidden="true" className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gray-300)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        <p className="text-sm font-medium" style={{ color: 'var(--gray-500)' }}>Withdrawal — Phase 4</p>
        <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
          On-chain USDC withdrawal will be available in the next release.
        </p>
      </div>
    </main>
  );
}
