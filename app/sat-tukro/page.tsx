import Product from '../../tools/sat-tukro/page';
import { site } from '../../tools/sat-tukro/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-sat-tukro"><Product /></div>;
}
