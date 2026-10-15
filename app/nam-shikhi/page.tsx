import Product from '../../tools/nam-shikhi/page';
import { site } from '../../tools/nam-shikhi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-nam-shikhi"><Product /></div>;
}
