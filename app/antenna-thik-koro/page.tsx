import Product from '../../tools/antenna-thik-koro/page';
import { site } from '../../tools/antenna-thik-koro/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-antenna-thik-koro"><Product /></div>;
}
