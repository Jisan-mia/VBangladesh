import Product from '../../tools/deri-hoye-gelo/page';
import { site } from '../../tools/deri-hoye-gelo/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-deri-hoye-gelo"><Product /></div>;
}
