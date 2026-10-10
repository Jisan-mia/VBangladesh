import Product from '../../tools/banan/page';
import { site } from '../../tools/banan/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-banan"><Product /></div>;
}
