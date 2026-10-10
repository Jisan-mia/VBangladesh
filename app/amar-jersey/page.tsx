import Product from '../../tools/amar-jersey/page';
import { site } from '../../tools/amar-jersey/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-amar-jersey"><Product /></div>;
}
