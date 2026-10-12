import { CategoryHub, hubMetadata } from '../../components/category-hub';
import { hubs } from '../../lib/hubs';

const hub = hubs.find(item => item.slug === 'games')!;
export const metadata = hubMetadata(hub);
export default function Page() {
  return <CategoryHub hub={hub} />;
}
