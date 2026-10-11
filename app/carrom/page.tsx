import Product from '../../tools/carrom/page';
import { site } from '../../tools/carrom/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-carrom"><Product /></div>;
}
