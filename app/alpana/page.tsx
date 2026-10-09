import Product from '../../tools/alpana/page';
import { site } from '../../tools/alpana/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-alpana"><Product /></div>;
}
