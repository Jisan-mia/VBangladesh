import Product from '../../tools/matcher-mon/page';
import { site } from '../../tools/matcher-mon/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-matcher-mon"><Product /></div>;
}
