import Product from '../../tools/sur-banai/page';
import { site } from '../../tools/sur-banai/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-sur-banai"><Product /></div>;
}
