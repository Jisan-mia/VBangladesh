import Product from '../../tools/pitha/page';
import { site } from '../../tools/pitha/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-pitha"><Product /></div>;
}
