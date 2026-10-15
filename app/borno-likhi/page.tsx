import Product from '../../tools/borno-likhi/page';
import { site } from '../../tools/borno-likhi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-borno-likhi"><Product /></div>;
}
