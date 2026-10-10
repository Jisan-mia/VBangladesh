import Product from '../../tools/biye-kobe/page';
import { site } from '../../tools/biye-kobe/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-biye-kobe"><Product /></div>;
}
