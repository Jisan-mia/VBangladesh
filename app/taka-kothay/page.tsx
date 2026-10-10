import Product from '../../tools/taka-kothay/page';
import { site } from '../../tools/taka-kothay/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-taka-kothay"><Product /></div>;
}
