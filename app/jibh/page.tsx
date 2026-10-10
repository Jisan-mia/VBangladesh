import Product from '../../tools/jibh/page';
import { site } from '../../tools/jibh/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-jibh"><Product /></div>;
}
