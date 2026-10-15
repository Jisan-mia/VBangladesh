import Product from '../../tools/kar-chinho/page';
import { site } from '../../tools/kar-chinho/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-kar-chinho"><Product /></div>;
}
