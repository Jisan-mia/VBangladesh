import Product from '../../tools/cinema-poster/page';
import { site } from '../../tools/cinema-poster/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-cinema-poster"><Product /></div>;
}
