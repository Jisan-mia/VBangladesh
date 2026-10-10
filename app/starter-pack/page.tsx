import Product from '../../tools/starter-pack/page';
import { site } from '../../tools/starter-pack/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-starter-pack"><Product /></div>;
}
