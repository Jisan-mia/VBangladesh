import Product from '../../tools/mache-bhate/page';
import { site } from '../../tools/mache-bhate/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-mache-bhate"><Product /></div>;
}
