import Product from '../../tools/baicher-nouka/page';
import { site } from '../../tools/baicher-nouka/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-baicher-nouka"><Product /></div>;
}
