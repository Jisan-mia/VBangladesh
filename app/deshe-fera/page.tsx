import Product from '../../tools/deshe-fera/page';
import { site } from '../../tools/deshe-fera/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-deshe-fera"><Product /></div>;
}
