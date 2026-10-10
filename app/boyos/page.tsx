import Product from '../../tools/boyos/page';
import { site } from '../../tools/boyos/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-boyos"><Product /></div>;
}
