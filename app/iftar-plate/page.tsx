import Product from '../../tools/iftar-plate/page';
import { site } from '../../tools/iftar-plate/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-iftar-plate"><Product /></div>;
}
