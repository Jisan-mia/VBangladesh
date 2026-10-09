import { site as tool13 } from '../tools/riksharong/content';
import { site as tool14 } from '../tools/nokshar-khata/content';
import { site as tool15 } from '../tools/lekhar-poster/content';
import { site as tool16 } from '../tools/chhobi-jora/content';
import { site as tool17 } from '../tools/shobdo-khela/content';
import { site as tool18 } from '../tools/soptaher-chhok/content';
import { site as tool19 } from '../tools/bhagabhagi/content';
import { site as tool0 } from '../tools/alpana/content';
import { site as tool1 } from '../tools/amar-chhotobela/content';
import { site as tool2 } from '../tools/bazar-note/content';
import { site as tool3 } from '../tools/bhara/content';
import { site as tool4 } from '../tools/bhashar-chhobi/content';
import { site as tool5 } from '../tools/chhotto-para/content';
import { site as tool6 } from '../tools/cholo-kheli/content';
import { site as tool7 } from '../tools/deadline/content';
import { site as tool8 } from '../tools/ek-ghonta/content';
import { site as tool9 } from '../tools/free-afternoon/content';
import { site as tool10 } from '../tools/kagojer-mela/content';
import { site as tool11 } from '../tools/rannakhata/content';
import { site as tool12 } from '../tools/sobuj-kon/content';

export const toolContent = {
  'alpana': tool0,
  'amar-chhotobela': tool1,
  'bazar-note': tool2,
  'bhara': tool3,
  'bhashar-chhobi': tool4,
  'chhotto-para': tool5,
  'cholo-kheli': tool6,
  'deadline': tool7,
  'ek-ghonta': tool8,
  'free-afternoon': tool9,
  'kagojer-mela': tool10,
  'rannakhata': tool11,
  'sobuj-kon': tool12,
  'riksharong': tool13,
  'nokshar-khata': tool14,
  'lekhar-poster': tool15,
  'chhobi-jora': tool16,
  'shobdo-khela': tool17,
  'soptaher-chhok': tool18,
  'bhagabhagi': tool19,
};
export type ToolSlug = keyof typeof toolContent;
export const toolSlugs = Object.keys(toolContent) as ToolSlug[];

export function getToolContent(slug: string) {
  return Object.hasOwn(toolContent, slug) ? toolContent[slug as ToolSlug] : undefined;
}
