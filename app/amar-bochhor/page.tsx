import Product from '../../tools/amar-bochhor/page';
import { site } from '../../tools/amar-bochhor/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-amar-bochhor"><Product /></div>;
}
