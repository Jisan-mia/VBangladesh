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
import { share as gpa } from '../tools/gpa/share';
import { share as komon_porlo } from '../tools/komon-porlo/share';
import { share as argentina_na_brazil } from '../tools/argentina-na-brazil/share';
import { share as koto_din_baki } from '../tools/koto-din-baki/share';
import { share as mishtir_baksho } from '../tools/mishtir-baksho/share';
import { share as taka_kothay } from '../tools/taka-kothay/share';
import { share as amar_jersey } from '../tools/amar-jersey/share';
import { share as boyos } from '../tools/boyos/share';
import { share as iftar_plate } from '../tools/iftar-plate/share';
import { share as cinema_poster } from '../tools/cinema-poster/share';
import { share as banan } from '../tools/banan/share';
import { share as dom_atkano } from '../tools/dom-atkano/share';

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
  'gpa': gpa,
  'komon-porlo': komon_porlo,
  'argentina-na-brazil': argentina_na_brazil,
  'koto-din-baki': koto_din_baki,
  'mishtir-baksho': mishtir_baksho,
  'taka-kothay': taka_kothay,
  'amar-jersey': amar_jersey,
  'boyos': boyos,
  'iftar-plate': iftar_plate,
  'cinema-poster': cinema_poster,
  'banan': banan,
  'dom-atkano': dom_atkano,
};

export function toolShare(tool: string): ToolShare | null {
  return Object.hasOwn(shareRegistry, tool) ? shareRegistry[tool as ToolSlug] : null;
}
