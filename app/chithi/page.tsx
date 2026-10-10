import Product from '../../tools/chithi/page';
import { site } from '../../tools/chithi/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-chithi"><Product /></div>;
}
