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
import { share as salami_chek } from '../tools/salami-chek/share';
import { share as eta_na_ota } from '../tools/eta-na-ota/share';
import { share as deshe_fera } from '../tools/deshe-fera/share';
import { share as biye_kobe } from '../tools/biye-kobe/share';
import { share as himu } from '../tools/himu/share';
import { share as pitha } from '../tools/pitha/share';
import { share as upohar } from '../tools/upohar/share';
import { share as namer_design } from '../tools/namer-design/share';
import { share as dawat } from '../tools/dawat/share';
import { share as desh_cheno } from '../tools/desh-cheno/share';
import { share as bhori } from '../tools/bhori/share';
import { share as tong } from '../tools/tong/share';
import { share as golir_ain } from '../tools/golir-ain/share';
import { share as amar_bochhor } from '../tools/amar-bochhor/share';
import { share as daknam } from '../tools/daknam/share';
import { share as cha_mudra } from '../tools/cha-mudra/share';
import { share as matir_bank } from '../tools/matir-bank/share';
import { share as shesh_bol } from '../tools/shesh-bol/share';
import { share as dhoyahin } from '../tools/dhoyahin/share';
import { share as ghuri } from '../tools/ghuri/share';
import { share as flames } from '../tools/flames/share';
import { share as moner_boyos } from '../tools/moner-boyos/share';
import { share as bagdhara } from '../tools/bagdhara/share';
import { share as sehri_iftar } from '../tools/sehri-iftar/share';
import { share as chithi } from '../tools/chithi/share';
import { share as bangla_typing } from '../tools/bangla-typing/share';
import { share as jam } from '../tools/jam/share';
import { share as bhorta } from '../tools/bhorta/share';
import { share as eider_din } from '../tools/eider-din/share';
import { share as ganer_koli } from '../tools/ganer-koli/share';
import { share as attiyo } from '../tools/attiyo/share';
import { share as studior_chhobi } from '../tools/studior-chhobi/share';
import { share as koto_cheno } from '../tools/koto-cheno/share';
import { share as eidjatra } from '../tools/eidjatra/share';
import { share as probash } from '../tools/probash/share';
import { share as char_priyo } from '../tools/char-priyo/share';
import { share as dhadha } from '../tools/dhadha/share';
import { share as tokhon_ekhon } from '../tools/tokhon-ekhon/share';
import { share as namta } from '../tools/namta/share';
import { share as prothom_ay } from '../tools/prothom-ay/share';
import { share as ami_bolechhilam } from '../tools/ami-bolechhilam/share';
import { share as mache_bhate } from '../tools/mache-bhate/share';
import { share as jomi } from '../tools/jomi/share';
import { share as ek_koti } from '../tools/ek-koti/share';
import { share as rokto } from '../tools/rokto/share';
import { share as cassette } from '../tools/cassette/share';
import { share as jibh } from '../tools/jibh/share';
import { share as matcher_mon } from '../tools/matcher-mon/share';
import { share as current_gelo } from '../tools/current-gelo/share';
import { share as projonmo } from '../tools/projonmo/share';
import { share as mama_jaben } from '../tools/mama-jaben/share';
import { share as mess_jibon } from '../tools/mess-jibon/share';
import { share as ekadosh } from '../tools/ekadosh/share';
import { share as gorur_ojon } from '../tools/gorur-ojon/share';
import { share as starter_pack } from '../tools/starter-pack/share';
import { share as mishron } from '../tools/mishron/share';
import { share as raat_jaga } from '../tools/raat-jaga/share';
import { share as betoner_bhag } from '../tools/betoner-bhag/share';
import { share as bidyut_bill } from '../tools/bidyut-bill/share';
import { share as mondop } from '../tools/mondop/share';
import { share as grade_dao } from '../tools/grade-dao/share';
import { share as adda } from '../tools/adda/share';
import { share as kalbaishakhi_aam } from '../tools/kalbaishakhi-aam/share';
import { share as dudh_uthlano } from '../tools/dudh-uthlano/share';
import { share as jhalmuri_sap } from '../tools/jhalmuri-sap/share';

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
  'dhoyahin': dhoyahin,
  'ghuri': ghuri,
  'flames': flames,
  'moner-boyos': moner_boyos,
  'bagdhara': bagdhara,
  'sehri-iftar': sehri_iftar,
  'chithi': chithi,
  'bangla-typing': bangla_typing,
  'jam': jam,
  'bhorta': bhorta,
  'eider-din': eider_din,
  'ganer-koli': ganer_koli,
  'attiyo': attiyo,
  'studior-chhobi': studior_chhobi,
  'koto-cheno': koto_cheno,
  'eidjatra': eidjatra,
  'probash': probash,
  'char-priyo': char_priyo,
  'dhadha': dhadha,
  'tokhon-ekhon': tokhon_ekhon,
  'namta': namta,
  'prothom-ay': prothom_ay,
  'ami-bolechhilam': ami_bolechhilam,
  'mache-bhate': mache_bhate,
  'jomi': jomi,
  'ek-koti': ek_koti,
  'rokto': rokto,
  'cassette': cassette,
  'jibh': jibh,
  'matcher-mon': matcher_mon,
  'current-gelo': current_gelo,
  'projonmo': projonmo,
  'mama-jaben': mama_jaben,
  'mess-jibon': mess_jibon,
  'ekadosh': ekadosh,
  'gorur-ojon': gorur_ojon,
  'starter-pack': starter_pack,
  'mishron': mishron,
  'raat-jaga': raat_jaga,
  'betoner-bhag': betoner_bhag,
  'bidyut-bill': bidyut_bill,
  'mondop': mondop,
  'grade-dao': grade_dao,
  'adda': adda,
  'kalbaishakhi-aam': kalbaishakhi_aam,
  'dudh-uthlano': dudh_uthlano,
  'jhalmuri-sap': jhalmuri_sap,
};

export function toolShare(tool: string): ToolShare | null {
  return Object.hasOwn(shareRegistry, tool) ? shareRegistry[tool as ToolSlug] : null;
}
