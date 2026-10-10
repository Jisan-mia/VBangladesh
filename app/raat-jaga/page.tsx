import Product from '../../tools/raat-jaga/page';
import { site } from '../../tools/raat-jaga/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-raat-jaga"><Product /></div>;
}
