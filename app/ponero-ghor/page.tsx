import Product from '../../tools/ponero-ghor/page';
import { site } from '../../tools/ponero-ghor/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ponero-ghor"><Product /></div>;
}
