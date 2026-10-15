import Product from '../../tools/sourojogot/page';
import { site } from '../../tools/sourojogot/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-sourojogot"><Product /></div>;
}
