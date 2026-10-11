import Product from '../../tools/paka-kancha/page';
import { site } from '../../tools/paka-kancha/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-paka-kancha"><Product /></div>;
}
