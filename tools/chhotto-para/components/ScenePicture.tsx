import { useId, type ReactNode, type RefObject, type SVGProps } from 'react';
import { objects, type SceneObject, type Setting } from '../lib/scene';
import { ObjectArt } from './ObjectArt';
import { SceneFront, SceneGround } from './SceneGround';

export const sceneViewport = { width: 960, height: 760 } as const;

type Props = { setting: Setting; items: SceneObject[]; svgRef?: RefObject<SVGSVGElement | null>; interaction?: SVGProps<SVGSVGElement>; ground?: ReactNode; overlay?: ReactNode };

/** The para as a tinted old photo: sky, ground and objects drawn back to front. The card canvas rasterises this same SVG. */
export function ScenePicture({ setting, items, svgRef, interaction, ground, overlay }: Props) {
  const sky = 'sky' + useId().replace(/[^\w-]/g, '');
  const sorted = items.slice().sort((left, right) => left.y - right.y);
  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${sceneViewport.width} ${sceneViewport.height}`} width={sceneViewport.width} height={sceneViewport.height} role="img"
    aria-label={`${setting === 'courtyard' ? 'গ্রামের উঠোন' : 'শহরের ছাদ'}: ${items.map(item => objects[item.kind].label).join(', ')}`} {...interaction}>
    <defs><linearGradient id={sky} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={setting === 'courtyard' ? '#cfe1df' : '#d9e2ea'} /><stop offset=".55" stopColor="#f6edd8" /><stop offset="1" stopColor="#efe2c6" /></linearGradient></defs>
    <rect width={sceneViewport.width} height={sceneViewport.height} fill={`url(#${sky})`} />
    <circle cx="809" cy="112" r="38" fill="#f0cf86" opacity=".7" />
    <SceneGround setting={setting} />
    {ground}
    {sorted.map(item => <g key={item.id} data-object-id={item.id} transform={`translate(${item.x} ${item.y})`}><ObjectArt kind={item.kind} /></g>)}
    <SceneFront setting={setting} />
    {overlay}
  </svg>;
}
