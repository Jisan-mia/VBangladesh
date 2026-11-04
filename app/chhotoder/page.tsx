import { hubMetadata } from '../../components/category-hub';
import { GameHub } from '../../components/game-hub';
import { hubs } from '../../lib/hubs';
import { kidsFilters } from '../../lib/portal';

const hub = hubs.find(item => item.slug === 'chhotoder')!;
export const metadata = hubMetadata(hub);
export default function Page() {
  return <GameHub hub={hub} filters={kidsFilters} aboutHeading="আব্বু-আম্মুর জন্য" />;
}
