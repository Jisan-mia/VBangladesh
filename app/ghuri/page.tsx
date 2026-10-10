import Product from '../../tools/ghuri/page';
import { site } from '../../tools/ghuri/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ghuri"><Product /></div>;
}
