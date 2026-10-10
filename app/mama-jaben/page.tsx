import Product from '../../tools/mama-jaben/page';
import { site } from '../../tools/mama-jaben/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-mama-jaben"><Product /></div>;
}
