import Product from '../../tools/lekhar-poster/page';
import { site } from '../../tools/lekhar-poster/content';
import { pageMetadata } from '../../shared/seo';
export const metadata = pageMetadata(site);
export default function Page(){return <div className="tool-lekhar-poster"><Product /></div>;}
