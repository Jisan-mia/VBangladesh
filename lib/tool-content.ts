import { site as alpana } from '../tools/alpana/content';
import { site as amar_chhotobela } from '../tools/amar-chhotobela/content';
import { site as bazar_note } from '../tools/bazar-note/content';
import { site as bhara } from '../tools/bhara/content';
import { site as bhashar_chhobi } from '../tools/bhashar-chhobi/content';
import { site as chhotto_para } from '../tools/chhotto-para/content';
import { site as cholo_kheli } from '../tools/cholo-kheli/content';
import { site as rannakhata } from '../tools/rannakhata/content';
import { site as riksharong } from '../tools/riksharong/content';
import { site as shobdo_khela } from '../tools/shobdo-khela/content';
import { site as bhagabhagi } from '../tools/bhagabhagi/content';
import { site as shubhechha } from '../tools/shubhechha/content';

export const toolContent = {
  'alpana': alpana,
  'amar-chhotobela': amar_chhotobela,
  'bazar-note': bazar_note,
  'bhara': bhara,
  'bhashar-chhobi': bhashar_chhobi,
  'chhotto-para': chhotto_para,
  'cholo-kheli': cholo_kheli,
  'rannakhata': rannakhata,
  'riksharong': riksharong,
  'shobdo-khela': shobdo_khela,
  'bhagabhagi': bhagabhagi,
  'shubhechha': shubhechha,
};
export type ToolSlug = keyof typeof toolContent;
export const toolSlugs = Object.keys(toolContent) as ToolSlug[];

export function getToolContent(slug: string) {
  return Object.hasOwn(toolContent, slug) ? toolContent[slug as ToolSlug] : undefined;
}
