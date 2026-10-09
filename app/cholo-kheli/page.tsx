import Product from '../../tools/cholo-kheli/page';
import { site } from '../../tools/cholo-kheli/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-cholo-kheli"><Product /></div>;
}
