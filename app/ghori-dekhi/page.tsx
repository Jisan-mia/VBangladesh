import Product from '../../tools/ghori-dekhi/page';
import { site } from '../../tools/ghori-dekhi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ghori-dekhi"><Product /></div>;
}
