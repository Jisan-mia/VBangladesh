'use client';

type HistoryControls = { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean };
export function HistoryButtons({ undo, redo, canUndo, canRedo }: HistoryControls) {
  return <div className="studio-history" role="group" aria-label="আগের অবস্থায় ফেরা"><button type="button" onClick={undo} disabled={!canUndo}>↶ এক ধাপ পেছাও</button><button type="button" onClick={redo} disabled={!canRedo}>↷ এক ধাপ এগোও</button></div>;
}
