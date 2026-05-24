export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>Transaction history</h1>
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl py-16 text-center"
        style={{ border: '1px dashed var(--gray-200)', background: 'var(--gray-50)' }}
      >
        <svg aria-hidden="true" className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gray-300)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium" style={{ color: 'var(--gray-500)' }}>No transactions yet</p>
        <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Your trade history will appear here — Phase 4.</p>
      </div>
    </main>
  );
}
