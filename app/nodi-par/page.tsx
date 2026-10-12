import Product from '../../tools/nodi-par/page';
import { site } from '../../tools/nodi-par/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-nodi-par"><Product /></div>;
}
