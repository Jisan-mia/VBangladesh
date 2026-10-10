import Product from '../../tools/dhadha/page';
import { site } from '../../tools/dhadha/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-dhadha"><Product /></div>;
}
