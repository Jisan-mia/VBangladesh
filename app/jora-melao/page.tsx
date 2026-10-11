import Product from '../../tools/jora-melao/page';
import { site } from '../../tools/jora-melao/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-jora-melao"><Product /></div>;
}
