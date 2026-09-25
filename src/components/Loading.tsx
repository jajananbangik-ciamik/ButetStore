export function LoadingScreen({ label = 'Memuat BUTET STORE…' }: { label?: string }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <span className="loading-screen__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}
