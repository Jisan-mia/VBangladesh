import Product from '../../tools/jam/page';
import { site } from '../../tools/jam/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-jam"><Product /></div>;
}
