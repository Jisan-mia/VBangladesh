import Product from '../../tools/sobuj-kon/page';
import { site } from '../../tools/sobuj-kon/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-sobuj-kon"><Product /></div>;
}
