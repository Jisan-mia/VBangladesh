import Product from '../../tools/koto-cheno/page';
import { site } from '../../tools/koto-cheno/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-koto-cheno"><Product /></div>;
}
