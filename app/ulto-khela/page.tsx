import Product from '../../tools/ulto-khela/page';
import { site } from '../../tools/ulto-khela/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ulto-khela"><Product /></div>;
}
