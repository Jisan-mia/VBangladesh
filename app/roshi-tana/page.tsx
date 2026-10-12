import Product from '../../tools/roshi-tana/page';
import { site } from '../../tools/roshi-tana/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-roshi-tana"><Product /></div>;
}
