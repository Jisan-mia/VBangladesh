import Product from '../../tools/golokdhadha/page';
import { site } from '../../tools/golokdhadha/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-golokdhadha"><Product /></div>;
}
