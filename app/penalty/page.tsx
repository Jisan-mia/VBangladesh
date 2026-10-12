import Product from '../../tools/penalty/page';
import { site } from '../../tools/penalty/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-penalty"><Product /></div>;
}
