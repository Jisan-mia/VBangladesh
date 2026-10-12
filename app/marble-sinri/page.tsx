import Product from '../../tools/marble-sinri/page';
import { site } from '../../tools/marble-sinri/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-marble-sinri"><Product /></div>;
}
