import Product from '../../tools/golir-badminton/page';
import { site } from '../../tools/golir-badminton/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-golir-badminton"><Product /></div>;
}
