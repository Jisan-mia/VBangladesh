import Product from '../../tools/tokhon-ekhon/page';
import { site } from '../../tools/tokhon-ekhon/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-tokhon-ekhon"><Product /></div>;
}
