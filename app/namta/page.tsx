import Product from '../../tools/namta/page';
import { site } from '../../tools/namta/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-namta"><Product /></div>;
}
