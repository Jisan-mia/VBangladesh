import Product from '../../tools/bagdhara/page';
import { site } from '../../tools/bagdhara/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bagdhara"><Product /></div>;
}
