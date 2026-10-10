import Product from '../../tools/grade-dao/page';
import { site } from '../../tools/grade-dao/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-grade-dao"><Product /></div>;
}
