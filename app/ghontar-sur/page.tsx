import Product from '../../tools/ghontar-sur/page';
import { site } from '../../tools/ghontar-sur/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-ghontar-sur"><Product /></div>;
}
