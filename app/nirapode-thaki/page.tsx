import Product from '../../tools/nirapode-thaki/page';
import { site } from '../../tools/nirapode-thaki/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-nirapode-thaki"><Product /></div>;
}
