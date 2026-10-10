import Product from '../../tools/current-gelo/page';
import { site } from '../../tools/current-gelo/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-current-gelo"><Product /></div>;
}
