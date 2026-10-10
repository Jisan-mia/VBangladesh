import Product from '../../tools/komon-porlo/page';
import { site } from '../../tools/komon-porlo/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-komon-porlo"><Product /></div>;
}
