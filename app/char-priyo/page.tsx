import Product from '../../tools/char-priyo/page';
import { site } from '../../tools/char-priyo/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-char-priyo"><Product /></div>;
}
