'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LedgerEditor } from './ledger-editor';
import { MealEditor } from './meal-editor';

type Mode = 'equal' | 'meal';
const modes: Array<[Mode, string]> = [['equal', 'সমান ভাগ'], ['meal', 'মেসের মিল রেট']];

/** Two khatas, one shown: both stay mounted so switching never loses what was typed. `/bhagabhagi#mil` opens the meal-rate one. */
export function SplitModes() {
  const [mode, setMode] = useState<Mode>('equal');
  const clicked = useRef(false);
  const showEqual = useCallback(() => setMode('equal'), []);
  const showMeal = useCallback(() => setMode('meal'), []);
  useEffect(() => { if (window.location.hash === '#mil') setMode('meal'); }, []);
  // The tapped tab sits in the khata that just got hidden; carry focus to the same tab in the one now shown.
  useEffect(() => { if (clicked.current) document.getElementById(`split-tab-${mode}-${mode}`)?.focus(); clicked.current = false; }, [mode]);
  const tabs = (owner: Mode) => <div className="split-modes" role="group" aria-label="কোন হিসাব করবে?">
    {modes.map(([value, label]) => <button type="button" key={value} id={`split-tab-${owner}-${value}`} aria-pressed={mode === value} onClick={() => { clicked.current = value !== mode; setMode(value); }}>{label}</button>)}
  </div>;
  return <>
    <div hidden={mode !== 'equal'}><LedgerEditor tabs={tabs('equal')} onFriend={showEqual} /></div>
    <div hidden={mode !== 'meal'}><MealEditor tabs={tabs('meal')} onFriend={showMeal} /></div>
  </>;
}
