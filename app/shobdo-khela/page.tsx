import Product from '../../tools/shobdo-khela/page';
import { site } from '../../tools/shobdo-khela/content';
import { pageMetadata } from '../../shared/seo';
export const metadata = pageMetadata(site);
export default function Page(){return <div className="tool-shobdo-khela"><Product /></div>;}
