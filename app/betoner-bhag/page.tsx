import Product from '../../tools/betoner-bhag/page';
import { site } from '../../tools/betoner-bhag/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-betoner-bhag"><Product /></div>;
}
