export function MemorySketch({ drawing }: { drawing: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={drawing} />
    </svg>
  );
}
