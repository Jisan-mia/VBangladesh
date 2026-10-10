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
import { site as gpa } from '../tools/gpa/content';
import { site as komon_porlo } from '../tools/komon-porlo/content';
import { site as argentina_na_brazil } from '../tools/argentina-na-brazil/content';
import { site as koto_din_baki } from '../tools/koto-din-baki/content';
import { site as mishtir_baksho } from '../tools/mishtir-baksho/content';
import { site as taka_kothay } from '../tools/taka-kothay/content';
import { site as amar_jersey } from '../tools/amar-jersey/content';
import { site as boyos } from '../tools/boyos/content';
import { site as iftar_plate } from '../tools/iftar-plate/content';
import { site as cinema_poster } from '../tools/cinema-poster/content';
import { site as banan } from '../tools/banan/content';
import { site as dom_atkano } from '../tools/dom-atkano/content';
import { site as salami_chek } from '../tools/salami-chek/content';
import { site as eta_na_ota } from '../tools/eta-na-ota/content';
import { site as deshe_fera } from '../tools/deshe-fera/content';
import { site as biye_kobe } from '../tools/biye-kobe/content';
import { site as himu } from '../tools/himu/content';
import { site as pitha } from '../tools/pitha/content';
import { site as upohar } from '../tools/upohar/content';
import { site as namer_design } from '../tools/namer-design/content';
import { site as dawat } from '../tools/dawat/content';
import { site as desh_cheno } from '../tools/desh-cheno/content';
import { site as bhori } from '../tools/bhori/content';
import { site as tong } from '../tools/tong/content';
import { site as golir_ain } from '../tools/golir-ain/content';
import { site as amar_bochhor } from '../tools/amar-bochhor/content';
import { site as daknam } from '../tools/daknam/content';
import { site as cha_mudra } from '../tools/cha-mudra/content';
import { site as matir_bank } from '../tools/matir-bank/content';
import { site as shesh_bol } from '../tools/shesh-bol/content';

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
  'salami-chek': salami_chek,
  'eta-na-ota': eta_na_ota,
  'deshe-fera': deshe_fera,
  'biye-kobe': biye_kobe,
  'himu': himu,
  'pitha': pitha,
  'upohar': upohar,
  'namer-design': namer_design,
  'dawat': dawat,
  'desh-cheno': desh_cheno,
  'bhori': bhori,
  'tong': tong,
  'golir-ain': golir_ain,
  'amar-bochhor': amar_bochhor,
  'daknam': daknam,
  'cha-mudra': cha_mudra,
  'matir-bank': matir_bank,
  'shesh-bol': shesh_bol,
};
export type ToolSlug = keyof typeof toolContent;
export const toolSlugs = Object.keys(toolContent) as ToolSlug[];

export function getToolContent(slug: string) {
  return Object.hasOwn(toolContent, slug) ? toolContent[slug as ToolSlug] : undefined;
}
