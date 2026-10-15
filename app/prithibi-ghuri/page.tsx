import Product from '../../tools/prithibi-ghuri/page';
import { site } from '../../tools/prithibi-ghuri/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-prithibi-ghuri"><Product /></div>;
}
