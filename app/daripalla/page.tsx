import Product from '../../tools/daripalla/page';
import { site } from '../../tools/daripalla/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-daripalla"><Product /></div>;
}
