import Product from '../../tools/bhori/page';
import { site } from '../../tools/bhori/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bhori"><Product /></div>;
}
