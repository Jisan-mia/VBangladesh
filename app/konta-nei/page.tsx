import Product from '../../tools/konta-nei/page';
import { site } from '../../tools/konta-nei/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-konta-nei"><Product /></div>;
}
