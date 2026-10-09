'use client';
import { useRef } from 'react';
import { useHistory } from '../../../shared/use-history';
import { FittedSvgText } from '../../../shared/fitted-svg-text';
import { ArtworkDownloads } from '../../../shared/art-downloads';
import { cardLines, defaultCard, limitText, objects, palettes, selectCardObject, type LanguageCard, type ObjectId } from '../lib/cards';
import { ObjectArt } from './object-art';

export function CardBuilder() {
  const history = useHistory<LanguageCard>(defaultCard);
  const { objectId, word, area, pronunciation, paletteIndex } = history.value;
  function update<Key extends keyof LanguageCard>(key: Key, value: LanguageCard[Key]) {
    history.commit(current => ({ ...current, [key]: value }));
  }
  const svgRef = useRef<SVGSVGElement>(null);
  const object = objects.find(item => item.id === objectId)!;
  const palette = palettes[paletteIndex];
  const lines = cardLines(word || object.name);
  function chooseObject(id: ObjectId) {
    history.commit(current => selectCardObject(current, id));
  }
  function reset() {
    if (!window.confirm('লেখা ও পছন্দ মুছে শুরুর কার্ডে ফিরবেন? আগের ধাপ দিয়ে আবার ফিরিয়ে আনতে পারবেন।')) return;
    history.commit(defaultCard);
  }
  return <div className="creative-grid language-grid"><div className="creative-preview language-preview"><div className="language-history" role="group" aria-label="পরিবর্তন ফিরিয়ে আনুন"><button type="button" disabled={!history.canUndo} onClick={history.undo}>আগের ধাপ</button><button type="button" disabled={!history.canRedo} onClick={history.redo}>পরের ধাপ</button><button type="button" onClick={reset}>শুরুর কার্ডে ফিরুন</button></div><svg ref={svgRef} viewBox="0 0 600 740" width="600" height="740" role="img" aria-label={`${word || object.name} — ${area || 'নিজের এলাকার নাম দিয়ে তৈরি করুন'}`}>
    <rect width="600" height="740" fill={palette.paper}/><rect x="24" y="24" width="552" height="692" rx="3" fill="none" stroke={palette.line}/><path d="M65 83h470M65 574h470M65 662h470" stroke={palette.line}/><text x="65" y="66" fill={palette.ink} fontSize="18" fontFamily="Bangla">আমাদের ভাষার ছবিখাতা</text><circle cx="518" cy="59" r="13" fill={palette.seal}/><g transform="translate(124 90) scale(1.1)"><ObjectArt object={objectId}/></g><FittedSvgText x="300" y="456" textAnchor="middle" fill={palette.ink} fontSize={15} maxWidth={470}>{area ? `${area} · আমাদের বলা নাম` : 'আপনার বলা নাম'}</FittedSvgText>{lines.map((line,index)=><FittedSvgText key={index} x="300" y={503+index*44} textAnchor="middle" fill={palette.ink} fontSize={lines.length>1 ? 33 : 48} maxWidth={470} fontWeight="600">{line}</FittedSvgText>)}<FittedSvgText x="300" y="606" textAnchor="middle" fill={palette.ink} fontSize={19} maxWidth={470}>{pronunciation ? `উচ্চারণ: ${pronunciation}` : `পরিচিত নাম: ${object.name}`}</FittedSvgText><text x="300" y="641" textAnchor="middle" fill={palette.ink} fontSize="16" fontFamily="Bangla">আপনাদের এলাকায় কী বলে?</text><text x="65" y="693" fill={palette.ink} fontSize="12" fontFamily="Bangla">নিজের দেওয়া শব্দ দিয়ে তৈরি · অভিধানের তথ্য নয়</text>
  </svg><ArtworkDownloads svgRef={svgRef} filename="আমাদের-ভাষার-ছবিখাতা"/><button className="language-print button-secondary" type="button" onClick={()=>window.print()}>কার্ড প্রিন্ট করুন</button></div><div className="creative-controls"><h2>এক ছবি, কত নাম</h2><fieldset><legend>কোন ছবিটি রাখবেন?</legend><div className="language-objects">{objects.map(item=><button className="language-object" key={item.id} aria-pressed={objectId===item.id} onClick={()=>chooseObject(item.id)}><svg viewBox="0 0 320 320" width="70" height="70" aria-hidden="true"><ObjectArt object={item.id}/></svg><span>{item.name}</span></button>)}</div></fieldset><label className="creative-label" htmlFor="word">আপনাদের এলাকায় কী বলে?</label><input id="word" value={word} onChange={event=>update('word',limitText(event.target.value,28))} placeholder="নিজের বলা নাম লিখুন"/><p className="creative-help">একই জিনিসের একাধিক নাম হতে পারে। আপনার চেনা নামটি লিখুন।</p><label className="creative-label" htmlFor="area">এলাকার নাম <span>— চাইলে লিখুন</span></label><input id="area" value={area} onChange={event=>update('area',limitText(event.target.value,24))} placeholder="যেমন: কুমিল্লা"/><label className="creative-label language-gap" htmlFor="pronunciation">উচ্চারণ <span>— চাইলে লিখুন</span></label><input id="pronunciation" value={pronunciation} onChange={event=>update('pronunciation',limitText(event.target.value,26))} placeholder="যেভাবে বলেন, সেভাবে লিখুন"/><p className="creative-help">এখানে উচ্চারণ লিখে রাখা যায়। শব্দ রেকর্ড করা হয় না।</p><fieldset><legend>খাতার রং</legend><div className="creative-choices">{palettes.map((item,index)=><button className="creative-choice" aria-pressed={paletteIndex===index} key={item.name} onClick={()=>update('paletteIndex',index)}>{item.name}</button>)}</div></fieldset><p className="language-note">শব্দ ও এলাকার নাম আপনার দেওয়া। সাইটটি সেগুলো যাচাই করে না বা কোনো অঞ্চলের সবার ভাষা হিসেবে দেখায় না।</p></div></div>;
}
