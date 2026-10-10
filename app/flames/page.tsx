import Product from '../../tools/flames/page';
import { site } from '../../tools/flames/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-flames"><Product /></div>;
}
