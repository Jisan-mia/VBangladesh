import Product from '../../tools/shobdo-khoja/page';
import { site } from '../../tools/shobdo-khoja/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-shobdo-khoja"><Product /></div>;
}
