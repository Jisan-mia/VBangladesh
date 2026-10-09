import Product from '../../tools/nokshar-khata/page';
import { site } from '../../tools/nokshar-khata/content';
import { pageMetadata } from '../../shared/seo';
export const metadata = pageMetadata(site);
export default function Page(){return <div className="tool-nokshar-khata"><Product /></div>;}
