import Product from '../../tools/ek-ghonta/page';
import { site } from '../../tools/ek-ghonta/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);
export const dynamic = 'force-dynamic';

export default function ToolPage() {
  return <div className="tool-ek-ghonta"><Product /></div>;
}
