import Product from '../../tools/mondop/page';
import { site } from '../../tools/mondop/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-mondop"><Product /></div>;
}
