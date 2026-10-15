import Product from '../../tools/juktoborno/page';
import { site } from '../../tools/juktoborno/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-juktoborno"><Product /></div>;
}
