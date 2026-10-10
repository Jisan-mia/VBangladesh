import Product from '../../tools/cassette/page';
import { site } from '../../tools/cassette/content';
import { pageMetadata } from '../../shared/seo';

export const metadata = pageMetadata(site);

export default function ToolPage() {
  return <div className="tool-cassette"><Product /></div>;
}
