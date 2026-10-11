import Product from '../../tools/handi-bhanga/page';
import { site } from '../../tools/handi-bhanga/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-handi-bhanga"><Product /></div>;
}
