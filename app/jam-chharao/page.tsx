import Product from '../../tools/jam-chharao/page';
import { site } from '../../tools/jam-chharao/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-jam-chharao"><Product /></div>;
}
