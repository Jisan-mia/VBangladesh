import Product from '../../tools/chhip-felo/page';
import { site } from '../../tools/chhip-felo/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-chhip-felo"><Product /></div>;
}
