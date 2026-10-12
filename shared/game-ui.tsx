'use client';
// Shared game controls: the site-wide sound switch, star rows and a level picker. Styles live in game-ui.css.
import { useSound, type LevelStars } from './game-kit';
import { sfx } from './game-sound';

const bn = new Intl.NumberFormat('bn-BD', { useGrouping: false });

/** The one sound switch every game shows (on by default, remembered for all games). `compact` shows the icon only, for crowded control rows. */
export function SoundToggle({ className = '', compact = false, onChange }: { className?: string; compact?: boolean; onChange?: (on: boolean) => void }) {
  const [on, setOn] = useSound();
  return <button type="button" className={`gx-sound ${compact ? 'gx-compact' : ''} ${className}`} aria-pressed={on} aria-label={compact ? (on ? 'শব্দ চালু' : 'শব্দ বন্ধ') : undefined} onClick={() => { setOn(!on); onChange?.(!on); if (!on) sfx.tap(); }}>
    <span aria-hidden="true">{on ? '🔊' : '🔇'}</span>{!compact && (on ? 'শব্দ চালু' : 'শব্দ বন্ধ')}
  </button>;
}

/** ★★☆ for a level; `of` defaults to 3. */
export function Stars({ count, of = 3, label = true }: { count: number; of?: number; label?: boolean }) {
  return <span className="gx-stars" role={label ? 'img' : undefined} aria-label={label ? `${bn.format(of)}টার মধ্যে ${bn.format(count)}টা তারা` : undefined} aria-hidden={label ? undefined : true}>
    {Array.from({ length: of }, (_, index) => <span key={index} className={index < count ? 'on' : ''}>★</span>)}
  </span>;
}

/** A grid of level buttons: cleared ones show stars, the next one glows, the rest are locked. */
export function LevelGrid({ count, stars, unlocked, current, onPick, noun = 'লেভেল' }: { count: number; stars: LevelStars; unlocked: number; current?: number; onPick: (level: number) => void; noun?: string }) {
  return <ol className="gx-levels" aria-label={`${noun} বেছে নাও`}>
    {Array.from({ length: count }, (_, index) => {
      const level = index + 1, locked = level > unlocked, earned = stars[level] ?? 0;
      return <li key={level}>
        <button type="button" disabled={locked} aria-current={level === current ? 'true' : undefined} className={!locked && !earned ? 'next' : ''}
          aria-label={locked ? `${noun} ${bn.format(level)}, বন্ধ` : `${noun} ${bn.format(level)}${earned ? `, ${bn.format(earned)} তারা` : ''}`}
          onClick={() => { sfx.tap(); onPick(level); }}>
          <b>{locked ? '🔒' : bn.format(level)}</b>
          {!locked && <Stars count={earned} label={false} />}
        </button>
      </li>;
    })}
  </ol>;
}
