import Product from '../../tools/bhagabhagi/page';
import { site } from '../../tools/bhagabhagi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bhagabhagi"><Product /></div>;
}
