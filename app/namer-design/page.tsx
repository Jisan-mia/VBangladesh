import Product from '../../tools/namer-design/page';
import { site } from '../../tools/namer-design/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-namer-design"><Product /></div>;
}
