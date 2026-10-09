import Product from '../../tools/riksharong/page';
import { site } from '../../tools/riksharong/content';
import { pageMetadata } from '../../shared/seo';
export const metadata = pageMetadata(site);
export default function Page(){return <div className="tool-riksharong"><Product /></div>;}
