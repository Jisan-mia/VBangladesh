import type { ToolShare } from '../shared/share-types';
import type { ToolSlug } from './tool-content';
import { share as alpana } from '../tools/alpana/share';
import { share as amar_chhotobela } from '../tools/amar-chhotobela/share';
import { share as bazar_note } from '../tools/bazar-note/share';
import { share as bhara } from '../tools/bhara/share';
import { share as bhashar_chhobi } from '../tools/bhashar-chhobi/share';
import { share as chhotto_para } from '../tools/chhotto-para/share';
import { share as cholo_kheli } from '../tools/cholo-kheli/share';
import { share as rannakhata } from '../tools/rannakhata/share';
import { share as riksharong } from '../tools/riksharong/share';
import { share as shobdo_khela } from '../tools/shobdo-khela/share';
import { share as bhagabhagi } from '../tools/bhagabhagi/share';
import { share as shubhechha } from '../tools/shubhechha/share';

// Each tool owns its share.ts; this map only wires them up for the API routes.
export const shareRegistry: Record<ToolSlug, ToolShare | null> = {
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

export function toolShare(tool: string): ToolShare | null {
  return Object.hasOwn(shareRegistry, tool) ? shareRegistry[tool as ToolSlug] : null;
}
