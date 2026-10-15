'use client';
// IP: what we avoided — no Meena, Sisimpur or TV look-alikes, no NCTB story text or pictures, no Nazrul/Jasimuddin; every story and drawing is original.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { loadCardFonts } from '../../../shared/card-canvas';
import { sfx, useSlowMode } from '../../../shared/game-kit';
import { SoundToggle } from '../../../shared/game-ui';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, bn, useKidsSession } from '../../../shared/kids-kit';
import { cardBlob, drawCard } from '../lib/draw-card';
import { PROGRESS_KEY, bothRead, empty, finish, isRead, nextUnread, readCount, readProgress, todayOf, type Progress } from '../lib/progress';
import { PEOPLE, STORIES, lastMood, pathOf, storyOf, whose, type Side } from '../lib/stories';
import { Portrait, Scene } from './art';

type View = { kind: 'shelf' } | { kind: 'read'; id: string; side: Side | null; step: number } | { kind: 'end'; id: string; side: Side };
const dhakaDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

export function GolperGame() {
  const [progress, setProgress] = useState<Progress>(empty);
  const [view, setView] = useState<View>({ kind: 'shelf' });
  const [showing, setShowing] = useState(false);
  const [site, setSite] = useState('');
  const [slow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const box = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try { setProgress(readProgress(localStorage.getItem(PROGRESS_KEY))); } catch { /* storage blocked: nothing saved */ }
    setSite(location.host);
  }, []);

  useEffect(() => {
    if (!showing) return;
    let live = true;
    loadCardFonts('গল্পের মোড় আজ গল্প পড়লাম দুই মোড়ই').then(() => { if (live && card.current) drawCard(card.current, todayOf(progress, dhakaDay()), progress, site); });
    return () => { live = false; };
  }, [showing, progress, site]);

  const go = (next: View) => {
    setView(next);
    const top = box.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) box.current?.scrollIntoView({ block: 'start', behavior: slow ? 'auto' : 'smooth' });
  };

  const open = (id: string) => { sfx.tap(); go({ kind: 'read', id, side: null, step: 0 }); };

  const done = (id: string, side: Side) => {
    const next = finish(progress, id, side, dhakaDay());
    setProgress(next);
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    sfx.good();
    go({ kind: 'end', id, side });
    atBreak();
  };

  const clear = () => {
    try { localStorage.removeItem(PROGRESS_KEY); } catch { /* none */ }
    setProgress(empty());
  };

  if (resting) return <RestScreen onExtend={extend} />;

  if (view.kind === 'shelf') {
    const hint = nextUnread(progress), first = readCount(progress) === 0;
    return <div className={`gm${slow ? ' gm-still' : ''}`} ref={box}>
      <ul className="gm-shelf" aria-label="গল্পগুলো">
        {STORIES.map(story => <li key={story.id}>
          <button type="button" className="gm-book" style={{ '--book': story.color } as CSSProperties} onClick={() => open(story.id)}>
            <Scene panel={story.intro[2]} className="gm-thumb" />
            <span className="gm-book-title">{story.title}</span>
            {isRead(progress, story.id) && <span className="gm-mark">{bothRead(progress, story.id) ? 'দুই মোড়ই পড়া হয়েছে' : 'পড়া হয়েছে'}</span>}
            {first && hint === story.id && <span className="gm-finger" aria-hidden="true" />}
          </button>
        </li>)}
      </ul>
      <p className="gm-count">{bn(STORIES.length)}টার মধ্যে {bn(readCount(progress))}টা পড়া হয়েছে</p>
      <div className="gm-grown">
        <ParentGate label="বড়দের জন্য">
          <ShareToolLink title="গল্পের মোড়" text="ছোটদের ৯টা ছোট গল্প, প্রতিটায় একটা মোড়। ফ্রি, অ্যাকাউন্ট লাগে না।" />
          <button type="button" className="kit-secondary" onClick={clear}>পড়ার দাগ মুছে দাও</button>
        </ParentGate>
      </div>
    </div>;
  }

  const story = storyOf(view.id)!;

  if (view.kind === 'end') {
    const other = PEOPLE[story.other], seen = progress.read[story.id] ?? [];
    return <div className={`gm gm-end${slow ? ' gm-still' : ''}`} ref={box}>
      <p className="gm-end-title">{story.title}</p>
      <Portrait who={story.other} mood={lastMood(story, view.side)} />
      <p className="gm-talk-label">{whose(other.name)} মুখটা দেখো। একসাথে ভাবো:</p>
      <p className="gm-talk">{story.choices[view.side].talk}</p>
      <button type="button" className="kit-primary gm-big" onClick={() => { sfx.tap(); go({ kind: 'read', id: story.id, side: view.side === 0 ? 1 : 0, step: story.intro.length - 1 }); }}>
        {seen.length === 2 ? 'অন্য মোড়টা আবার দেখো' : 'অন্যটা বেছে দেখো'}
      </button>
      <div className="gm-pair">
        <button type="button" className="kit-secondary gm-big" onClick={() => open(story.id)}>আবার পড়ো</button>
        <button type="button" className="kit-secondary gm-big" onClick={() => { sfx.tap(); go({ kind: 'shelf' }); }}>শেষ</button>
      </div>
      <ShowParentButton onClick={() => setShowing(true)} />
      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: 'golper-mor.png', make: () => cardBlob(todayOf(progress, dhakaDay()), progress, site) }}>
        <div className="kit-card"><canvas ref={card} width={1080} height={1350} aria-label="আজকের গল্পের হিসাব" /></div>
      </ShowParent>
    </div>;
  }

  const path = view.side === null ? story.intro : pathOf(story, view.side);
  const step = Math.min(view.step, path.length - 1), panel = path[step];
  const asking = step === story.intro.length - 1;
  const total = story.intro.length + story.choices[view.side ?? 0].panels.length;
  const seen = progress.read[story.id] ?? [];
  const next = () => {
    sfx.tap();
    if (step < path.length - 1) go({ ...view, step: step + 1 });
    else if (view.side !== null) done(story.id, view.side);
  };
  const choose = (side: Side) => { sfx.pick(); go({ kind: 'read', id: story.id, side, step: story.intro.length }); };

  return <div className={`gm gm-reader${slow ? ' gm-still' : ''}`} ref={box}>
    <div className="gm-bar">
      <button type="button" className="gm-back" onClick={() => { sfx.tap(); go({ kind: 'shelf' }); }}>← সব গল্প</button>
      <span className="gm-dots" role="img" aria-label={`${bn(total)}টা ছবির ${bn(step + 1)} নম্বর`}>{Array.from({ length: total }, (_, index) => <i key={index} className={index === step ? 'now' : index < step ? 'past' : ''} />)}</span>
      <SoundToggle compact />
    </div>
    <div className="gm-panel" key={`${view.side}-${step}`}>
      <Scene panel={panel} className="gm-scene" />
      <div className="gm-words">
        <p>{panel.text}</p>
        <SpeakButton text={asking ? `${panel.text} ${story.question}` : panel.text} />
      </div>
    </div>
    {asking
      ? <div className="gm-ask">
        <p className="gm-question">{story.question}</p>
        <div className="gm-choices">
          {story.choices.map((choice, index) => <button type="button" key={choice.label} className="gm-choice" onClick={() => choose(index as Side)}>
            <Scene panel={choice.panels[0]} className="gm-choice-pic" />
            <span>{choice.label}</span>
            {seen.includes(index as Side) && <small>দেখা হয়েছে</small>}
          </button>)}
        </div>
        {step > 0 && <button type="button" className="gm-prev" onClick={() => { sfx.tap(); go({ ...view, step: step - 1 }); }}>← আগের ছবি</button>}
      </div>
      : <div className="gm-nav">
        <button type="button" className="gm-prev" disabled={step === 0} onClick={() => { sfx.tap(); go({ ...view, step: step - 1 }); }} aria-label="আগের ছবি">←</button>
        <button type="button" className="kit-primary gm-next" onClick={next}>
          {step === path.length - 1 ? 'গল্প শেষ' : 'পরের ছবি →'}
          {readCount(progress) === 0 && step === 0 && <span className="gm-finger" aria-hidden="true" />}
        </button>
      </div>}
  </div>;
}
