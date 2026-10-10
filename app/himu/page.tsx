import Product from '../../tools/himu/page';
import { site } from '../../tools/himu/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-himu"><Product /></div>;
}
