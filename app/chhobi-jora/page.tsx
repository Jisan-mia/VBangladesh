import Product from '../../tools/chhobi-jora/page';
import { site } from '../../tools/chhobi-jora/content';
import { pageMetadata } from '../../shared/seo';
export const metadata = pageMetadata(site);
export default function Page(){return <div className="tool-chhobi-jora"><Product /></div>;}
