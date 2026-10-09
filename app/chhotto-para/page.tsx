import Product from '../../tools/chhotto-para/page';
import { site } from '../../tools/chhotto-para/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-chhotto-para"><Product /></div>;
}
