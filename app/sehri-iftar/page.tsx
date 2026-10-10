import Product from '../../tools/sehri-iftar/page';
import { site } from '../../tools/sehri-iftar/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-sehri-iftar"><Product /></div>;
}
