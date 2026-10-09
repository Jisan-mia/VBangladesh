import type { Ref } from 'react';
import { birdPath, drawingName, paletteFor, type BirdDesign } from '../lib/bird';

export function BirdFace({ design, prefix }: { design: BirdDesign; prefix: string }) {
  const palette = paletteFor(design);
  const outline = design.finish === 'outline';
  const ink = '#343029';
  const wing = 'M29 49C43 34 61 36 67 49C61 67 38 71 29 49Z';
  return <g>
    <defs><clipPath id={`${prefix}-body`}><path d={birdPath} /></clipPath><clipPath id={`${prefix}-wing`}><path d={wing} /></clipPath></defs>
    <path d={birdPath} fill={outline ? '#ffffff' : palette.body} />
    <g clipPath={`url(#${prefix}-body)`}>
      <path d="M30 77H67V92H30Z" fill={outline ? '#ffffff' : '#f2d9a6'} />
      <path d="M78 27L96 36L79 44Z" fill={outline ? '#ffffff' : palette.beak} stroke={outline ? ink : 'none'} strokeWidth="0.35" />
      <path d="M10 31L27 48M8 38L24 51" stroke={outline ? ink : palette.detail} strokeWidth={outline ? 0.45 : 2.3} strokeLinecap="round" />
      <path d={wing} fill={outline ? '#ffffff' : palette.wing} stroke={ink} strokeWidth="0.4" />
      <g clipPath={`url(#${prefix}-wing)`} stroke={outline ? ink : palette.body} fill={outline ? '#ffffff' : palette.detail}>
        {design.pattern === 'flowers' && [0, 1, 2].map(index => <g key={index} transform={`translate(${39 + index * 9} ${49 + (index % 2) * 6})`} strokeWidth="0.45"><path d="M0-5C3-8 5-3 3-1C8-1 6 4 2 3C3 8-3 7-2 3C-7 6-8 0-3-1C-6-5-1-7 0-5Z" /><circle r="1.3" fill={outline ? ink : palette.body} stroke="none" /></g>)}
        {design.pattern === 'dots' && [0, 1, 2, 3, 4, 5, 6].map(index => <circle key={index} cx={35 + (index % 4) * 8} cy={47 + Math.floor(index / 4) * 10} r="2" strokeWidth="0.4" />)}
        {design.pattern === 'stripes' && [0, 1, 2, 3, 4, 5].map(index => <path key={index} d={`M${30 + index * 7} 34l-10 37`} stroke={outline ? ink : palette.detail} strokeWidth={outline ? 0.5 : 2.5} fill="none" />)}
      </g>
      <circle cx="62" cy="22" r="5.2" fill={outline ? '#fff' : '#fff6da'} stroke={outline ? ink : 'none'} strokeWidth="0.4" /><circle cx="64" cy="22" r="2.1" fill={ink} /><circle cx="64.7" cy="21.2" r="0.6" fill="#fff" />
      <path d="M51 14l2-3m-7 6 1-4" stroke={outline ? ink : palette.detail} strokeWidth={outline ? 0.4 : 1.4} strokeLinecap="round" />
    </g>
    <path d={birdPath} stroke={ink} strokeWidth="0.45" fill="none" strokeLinejoin="round" />
  </g>;
}

export function StandingBird({ design, prefix }: { design: BirdDesign; prefix: string }) {
  return <g>
    <defs><clipPath id={`${prefix}-standing`}><rect x="0" y="0" width="100" height="77" /></clipPath></defs>
    <path d="M30 77L67 77L77 85L39 85Z" fill="#f1dcb4" stroke="#514735" strokeWidth="0.35" />
    <path d="M30 77L67 77L57 70L20 70Z" fill="#cfb784" stroke="#514735" strokeWidth="0.35" />
    <g clipPath={`url(#${prefix}-standing)`}><BirdFace design={design} prefix={`${prefix}-face`} /></g>
    <path d="M30 77H67" stroke="#514735" strokeWidth="0.45" />
  </g>;
}

export function BirdPortrait({ design, prefix, svgRef }: { design: BirdDesign; prefix: string; svgRef?: Ref<SVGSVGElement> }) {
  const palette = paletteFor(design);
  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" width="1080" height="1080" role="img" aria-label={`${drawingName(design.name)}: সাজানো কাগজের পাখির ছবি`}>
    <rect width="720" height="720" fill="#faf4e8" />
    <path d="M0 476C170 449 402 487 720 451V720H0Z" fill={palette.backdrop} />
    <path d="M69 475C223 458 493 490 649 467" fill="none" stroke="#d2c9b4" strokeWidth="1" />
    <ellipse cx="356" cy="548" rx="140" ry="17" fill="#b9ad93" opacity="0.2" />
    <g transform="translate(115 120) scale(5)"><StandingBird design={design} prefix={prefix} /></g>
    <g stroke="#a69e8a" strokeWidth="1.4" fill="none"><path d="m100 374-23-8m24-5-7-18M570 190l18-11m-25-1 3-21" /><circle cx="583" cy="363" r="7" /></g>
    <text x="360" y="607" textAnchor="middle" fontFamily="Bangla, sans-serif" fontSize="31" fill="#443b31">{drawingName(design.name)}</text>
    <text x="360" y="650" textAnchor="middle" fontFamily="Bangla, sans-serif" fontSize="15" letterSpacing="1" fill="#796d5d">কাগজের মেলা</text>
  </svg>;
}
