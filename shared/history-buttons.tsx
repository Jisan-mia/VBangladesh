'use client';

type HistoryControls = { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean };
export function HistoryButtons({ undo, redo, canUndo, canRedo }: HistoryControls) {
  return <div className="studio-history" role="group" aria-label="পরিবর্তন ফেরান"><button type="button" onClick={undo} disabled={!canUndo}>↶ আগের অবস্থায়</button><button type="button" onClick={redo} disabled={!canRedo}>↷ আবার করুন</button></div>;
}
