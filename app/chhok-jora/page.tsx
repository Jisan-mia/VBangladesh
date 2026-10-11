import Product from '../../tools/chhok-jora/page';
import { site } from '../../tools/chhok-jora/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-chhok-jora"><Product /></div>;
}
