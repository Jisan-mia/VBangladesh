import Product from '../../tools/tarer-fanke-belun/page';
import { site } from '../../tools/tarer-fanke-belun/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-tarer-fanke-belun"><Product /></div>;
}
