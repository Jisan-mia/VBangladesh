'use client';

import { useState } from 'react';
import { commitHistory, createHistory, redoHistory, undoHistory } from './history';

export function useHistory<T>(initial: T | (() => T)) {
  const [history, setHistory] = useState(() => createHistory(typeof initial === 'function' ? (initial as () => T)() : initial));

  function commit(next: T | ((current: T) => T)) {
    setHistory(current => commitHistory(current, typeof next === 'function' ? (next as (value: T) => T)(current.present) : next));
  }

  return {
    value: history.present,
    commit,
    undo: () => setHistory(undoHistory),
    redo: () => setHistory(redoHistory),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
