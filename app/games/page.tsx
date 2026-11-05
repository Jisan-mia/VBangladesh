import { hubMetadata } from '../../components/category-hub';
import { GameHub } from '../../components/game-hub';
import { hubs } from '../../lib/hubs';
import { gameFilters } from '../../lib/portal';

const hub = hubs.find(item => item.slug === 'games')!;
export const metadata = hubMetadata(hub);
export default function Page() {
  return <GameHub hub={hub} filters={gameFilters} aboutHeading="উঠোনের খেলা, এখন ফোনে" extraTiles={['chhotoder', 'quiz']} />;
}
