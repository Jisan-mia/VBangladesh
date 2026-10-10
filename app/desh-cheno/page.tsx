import Product from '../../tools/desh-cheno/page';
import { site } from '../../tools/desh-cheno/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-desh-cheno"><Product /></div>;
}
