import Product from '../../tools/deadline/page';
import { site } from '../../tools/deadline/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-deadline"><Product /></div>;
}
