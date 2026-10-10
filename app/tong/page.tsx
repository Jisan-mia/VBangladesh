import Product from '../../tools/tong/page';
import { site } from '../../tools/tong/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-tong"><Product /></div>;
}
