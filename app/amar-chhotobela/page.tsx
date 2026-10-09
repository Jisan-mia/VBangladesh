import Product from '../../tools/amar-chhotobela/page';
import { site } from '../../tools/amar-chhotobela/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-amar-chhotobela"><Product /></div>;
}
