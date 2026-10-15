import Product from '../../tools/dosh-ghater-nouka/page';
import { site } from '../../tools/dosh-ghater-nouka/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-dosh-ghater-nouka"><Product /></div>;
}
