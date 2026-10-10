import Product from '../../tools/studior-chhobi/page';
import { site } from '../../tools/studior-chhobi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-studior-chhobi"><Product /></div>;
}
