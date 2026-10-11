import Product from '../../tools/chor-police/page';
import { site } from '../../tools/chor-police/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-chor-police"><Product /></div>;
}
