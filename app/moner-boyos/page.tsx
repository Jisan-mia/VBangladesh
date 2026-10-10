import Product from '../../tools/moner-boyos/page';
import { site } from '../../tools/moner-boyos/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-moner-boyos"><Product /></div>;
}
