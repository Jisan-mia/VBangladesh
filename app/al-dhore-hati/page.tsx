import Product from '../../tools/al-dhore-hati/page';
import { site } from '../../tools/al-dhore-hati/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-al-dhore-hati"><Product /></div>;
}
