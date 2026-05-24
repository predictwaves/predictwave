export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'var(--green-600)' }}
          >
            P
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--gray-900)' }}>
            predict<span style={{ color: 'var(--green-600)' }}>waves</span>
          </span>
        </div>

        <p className="text-lg font-medium" style={{ color: 'var(--gray-700)' }}>
          Polymarket markets in Naira.
        </p>

        <span
          className="px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{
            background: 'var(--green-50)',
            color: 'var(--green-700)',
            border: '1px solid var(--green-200)',
          }}
        >
          Coming soon
        </span>
      </div>
    </main>
  );
}
