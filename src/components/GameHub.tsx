import { lazy, Suspense, useState } from 'react';
import { ArrowRight, Castle, RadioTower } from 'lucide-react';

const BridgeGame = lazy(() => import('../App'));
const RescueGame = lazy(() => import('./RescueGame'));

export default function GameHub() {
  const [game, setGame] = useState<'bridge' | 'rescue' | null>(null);
  const chooseGame = () => setGame(null);

  if (game) {
    return (
      <Suspense fallback={<p className="p-8 text-center" role="status">正在載入遊戲…</p>}>
        {game === 'bridge' ? <BridgeGame onChooseGame={chooseGame} /> : <RescueGame onChooseGame={chooseGame} />}
      </Suspense>
    );
  }

  return (
    <main className="game-hub min-h-svh flex items-center justify-center px-5 py-12">
      <div className="page-enter w-full max-w-4xl">
        <header className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">數學跑道樂園</h1>
          <p className="mt-3 text-lg text-slate-300">選擇遊戲</p>
        </header>
        <div className="grid gap-5 sm:grid-cols-2">
          <button type="button" className="game-card game-card-bridge" onClick={() => setGame('bridge')}>
            <span className="game-card-icon"><Castle size={44} aria-hidden="true" /></span>
            <span className="text-2xl font-black">數學橋樑軍團大作戰</span>
            <span className="text-slate-300 text-sm">選跑道、壯大軍團，挑戰守關首領。</span>
            <span className="game-card-action">進入設定 <ArrowRight size={18} /></span>
          </button>
          <button type="button" className="game-card game-card-rescue" onClick={() => setGame('rescue')}>
            <span className="game-card-icon"><RadioTower size={44} aria-hidden="true" /></span>
            <span className="text-2xl font-black">數學星光救援隊</span>
            <span className="text-slate-300 text-sm">帶領小機械人收集能量，點亮燈塔。</span>
            <span className="game-card-action">進入設定 <ArrowRight size={18} /></span>
          </button>
        </div>
      </div>
    </main>
  );
}
