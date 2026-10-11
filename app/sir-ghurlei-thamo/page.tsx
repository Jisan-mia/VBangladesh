import Product from '../../tools/sir-ghurlei-thamo/page';
import { site } from '../../tools/sir-ghurlei-thamo/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-sir-ghurlei-thamo"><Product /></div>;
}
