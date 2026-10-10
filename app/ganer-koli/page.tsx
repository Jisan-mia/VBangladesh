import Product from '../../tools/ganer-koli/page';
import { site } from '../../tools/ganer-koli/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ganer-koli"><Product /></div>;
}
