import Product from '../../tools/eidjatra/page';
import { site } from '../../tools/eidjatra/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-eidjatra"><Product /></div>;
}
