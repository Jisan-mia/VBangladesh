import './product.css';
import { GamePage } from '../../shared/game-player';
import { site } from './content';
import { ShopGame } from './components/shop-game';

export default function BhangtiNaiPage() {
  return (
    <GamePage site={site} kicker="মুদি দোকানের কাউন্টারে ভাংতির রাশ" title={site.headline}>
      <ShopGame />
    </GamePage>
  );
}
