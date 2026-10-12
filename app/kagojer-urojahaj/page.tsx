import Product from '../../tools/kagojer-urojahaj/page';
import { site } from '../../tools/kagojer-urojahaj/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-kagojer-urojahaj"><Product /></div>;
}
