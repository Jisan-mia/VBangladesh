import Product from '../../tools/daknam/page';
import { site } from '../../tools/daknam/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-daknam"><Product /></div>;
}
