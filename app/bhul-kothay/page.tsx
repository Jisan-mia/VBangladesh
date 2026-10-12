import Product from '../../tools/bhul-kothay/page';
import { site } from '../../tools/bhul-kothay/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bhul-kothay"><Product /></div>;
}
