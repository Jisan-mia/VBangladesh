import Product from '../../tools/abc-bazar/page';
import { site } from '../../tools/abc-bazar/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-abc-bazar"><Product /></div>;
}
