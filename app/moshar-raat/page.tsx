import Product from '../../tools/moshar-raat/page';
import { site } from '../../tools/moshar-raat/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-moshar-raat"><Product /></div>;
}
