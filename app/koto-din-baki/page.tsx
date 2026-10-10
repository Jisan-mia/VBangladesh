import Product from '../../tools/koto-din-baki/page';
import { site } from '../../tools/koto-din-baki/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-koto-din-baki"><Product /></div>;
}
