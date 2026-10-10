import Product from '../../tools/argentina-na-brazil/page';
import { site } from '../../tools/argentina-na-brazil/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-argentina-na-brazil"><Product /></div>;
}
