import Product from '../../tools/peoner-cycle/page';
import { site } from '../../tools/peoner-cycle/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-peoner-cycle"><Product /></div>;
}
