import Product from '../../tools/free-afternoon/page';
import { site } from '../../tools/free-afternoon/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);
export const dynamic = 'force-dynamic';

export default function ToolPage() {
  return <div className="tool-free-afternoon"><Product /></div>;
}
