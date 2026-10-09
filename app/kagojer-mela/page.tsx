import Product from '../../tools/kagojer-mela/page';
import { site } from '../../tools/kagojer-mela/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-kagojer-mela"><Product /></div>;
}
