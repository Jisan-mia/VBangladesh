import Product from '../../tools/bazar-note/page';
import { site } from '../../tools/bazar-note/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-bazar-note"><Product /></div>;
}
