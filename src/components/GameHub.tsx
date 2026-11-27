import { lazy, Suspense, useState } from 'react';
import { ArrowRight, Castle, Compass, Flag, RadioTower, Snowflake, Sparkles } from 'lucide-react';
import bridgeFortressUrl from '../assets/bridge-fortress.webp';
import bridgeGuardiansUrl from '../assets/bridge-guardians.webp';
import causewayUrl from '../assets/causeway.webp';
import rescueCaptainUrl from '../assets/rescue-captain.webp';

const BridgeGame = lazy(() => import('../App'));
const RescueGame = lazy(() => import('./RescueGame'));

export default function GameHub() {
  const [game, setGame] = useState<'bridge' | 'rescue' | null>(null);
  const chooseGame = () => setGame(null);

  if (game) {
    return (
      <Suspense fallback={<p className="p-8 text-center text-slate-200 font-bold" role="status">正在載入遊戲…</p>}>
        {game === 'bridge' ? <BridgeGame onChooseGame={chooseGame} /> : <RescueGame onChooseGame={chooseGame} />}
      </Suspense>
    );
  }

  return (
    <main className="game-hub min-h-svh flex items-center justify-center px-4 py-7 sm:px-6 sm:py-9">
      <div className="page-enter w-full max-w-5xl">
        <header className="mb-6 sm:mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3.5 py-1 text-xs font-black tracking-wide text-cyan-200">
              <Sparkles size={14} aria-hidden="true" />
              互動數學遊戲大廳 · 兩大類別 · 四款主題闖關
            </div>
            <h1 className="mt-2.5 text-3xl sm:text-5xl font-black tracking-tight text-white">數學闖關樂園</h1>
            <p className="mt-1.5 text-sm sm:text-base text-slate-300">
              清晰劃分「2D 心算求值」與「3D 路線比較」兩大系列，按學習目標自由揀選。
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-2 text-xs font-bold text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>支援桌面鍵盤 · 平板觸控即開即玩</span>
          </div>
        </header>

        {/* 分類一：2D 心算求值系列 */}
        <section aria-labelledby="cat-calc" className="mb-7">
          <div className="hub-cat-head">
            <h2 id="cat-calc" className="text-base sm:text-lg font-black text-sky-200">一、2D 心算求值系列</h2>
            <span className="text-xs font-bold text-slate-300">算出準確答案 · 訓練加減數感與九因歌</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {/* 遊戲 01：橋樑算術衝鋒 */}
            <button type="button" className="game-card game-card-bridge" onClick={() => setGame('bridge')}>
              <div className="game-card-banner" style={{ backgroundImage: `url(${bridgeFortressUrl})` }}>
                <div className="game-banner-scrim game-scrim-bridge" />
                <div className="game-banner-top">
                  <span className="game-badge game-badge-bridge">
                    <Castle size={13} aria-hidden="true" /> 遊戲 01 · 跑道求值
                  </span>
                  <span className="game-scale-pill">20 題闖關</span>
                </div>
                <div className="game-banner-visual">
                  <span
                    aria-hidden="true"
                    className="game-sprite-boss"
                    style={{ backgroundImage: `url(${bridgeGuardiansUrl})` }}
                  />
                </div>
              </div>

              <div className="game-card-body">
                <div>
                  <p className="game-subtitle text-sky-300">算式計值 · 軍團跑道對戰</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-white">橋樑算術衝鋒</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  閱讀上方算式或數感題，揀選正確答案跑道衝鋒增兵，升級武器決戰守關首領。
                </p>
                <div className="game-tags" aria-label="涵蓋訓練項目">
                  <span className="game-tag">20–100 加法</span>
                  <span className="game-tag">基礎數感</span>
                  <span className="game-tag">2–9 乘法</span>
                  <span className="game-tag">5–15 秒自選</span>
                </div>
                <span className="game-card-action">
                  進入《橋樑算術衝鋒》 <ArrowRight size={18} aria-hidden="true" />
                </span>
              </div>
            </button>

            {/* 遊戲 02：星光燈塔保衛戰 */}
            <button type="button" className="game-card game-card-rescue" onClick={() => setGame('rescue')}>
              <div className="game-card-banner" style={{ backgroundImage: `url(${causewayUrl})` }}>
                <div className="game-banner-scrim game-scrim-rescue" />
                <div className="game-banner-top">
                  <span className="game-badge game-badge-rescue">
                    <RadioTower size={13} aria-hidden="true" /> 遊戲 02 · 科幻守塔
                  </span>
                  <span className="game-scale-pill">10 題快玩</span>
                </div>
                <div className="game-banner-visual">
                  <img src={rescueCaptainUrl} alt="" className="game-banner-char" />
                </div>
              </div>

              <div className="game-card-body">
                <div>
                  <p className="game-subtitle text-teal-300">限時快答 · 能量護塔防衛</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-white">星光燈塔保衛戰</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  帶領機械人小隊駐守星光大橋，限時算出答案發射能量波，擊退怪物並點亮五層燈塔。
                </p>
                <div className="game-tags" aria-label="涵蓋訓練項目">
                  <span className="game-tag">20–100 加法</span>
                  <span className="game-tag">基礎數感</span>
                  <span className="game-tag">快答守橋</span>
                  <span className="game-tag">護盾攻防</span>
                </div>
                <span className="game-card-action">
                  進入《星光燈塔保衛戰》 <ArrowRight size={18} aria-hidden="true" />
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* 分類二：3D 路線比較系列 */}
        <section aria-labelledby="cat-compare">
          <div className="hub-cat-head">
            <h2 id="cat-compare" className="text-base sm:text-lg font-black text-amber-200">二、3D 路線比較系列</h2>
            <span className="text-xs font-bold text-slate-300">比較算式增幅 · 即時兵力推進攻防</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {/* 遊戲 03：數學大軍：攻城救公主 */}
            <a href="./army-gates/" className="game-card game-card-siege">
              <div className="game-card-banner game-banner-siege">
                <div className="game-banner-scrim game-scrim-siege" />
                <div className="game-banner-top">
                  <span className="game-badge game-badge-siege">
                    <Flag size={13} aria-hidden="true" /> 遊戲 03 · 3D 城堡攻堅
                  </span>
                  <span className="game-scale-pill">連破三牆</span>
                </div>
                <div className="game-banner-visual game-banner-pair">
                  <img src="./army-gates/art/commander.webp" alt="" className="game-banner-char-sm" />
                  <img src="./army-gates/art/princess.webp" alt="" className="game-banner-char-sm" />
                </div>
              </div>

              <div className="game-card-body">
                <div>
                  <p className="game-subtitle text-amber-300">門數比大小 · 3D 三牆破陣</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-white">數學大軍：攻城救公主</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  即時比較左右數學門揀選最大兵力，配合限時「答題大炮」機關掃射，連破三道城牆救出公主！
                </p>
                <div className="game-tags" aria-label="涵蓋訓練項目">
                  <span className="game-tag">加減混合</span>
                  <span className="game-tag">加減乘混合</span>
                  <span className="game-tag">雙門比大小</span>
                  <span className="game-tag">3D 機關大炮</span>
                </div>
                <span className="game-card-action">
                  進入《數學大軍》 <ArrowRight size={18} aria-hidden="true" />
                </span>
              </div>
            </a>

            {/* 遊戲 04：數學神炮：雪地三路 */}
            <a href="./cannon-battle/" className="game-card game-card-cannon">
              <div className="game-card-banner game-banner-cannon">
                <div className="game-banner-scrim game-scrim-cannon" />
                <div className="game-banner-top">
                  <span className="game-badge game-badge-cannon">
                    <Snowflake size={13} aria-hidden="true" /> 遊戲 04 · 3D 雪地三路
                  </span>
                  <span className="game-scale-pill">三路推線</span>
                </div>
                <div className="game-banner-visual" aria-hidden="true">
                  <svg viewBox="0 0 118 88" className="h-[88px] w-[118px] drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]">
                    <path d="M12 80 L26 20 L40 20 L34 80 Z" fill="#1e4d68" stroke="#7dd3fc" strokeWidth="1.5" />
                    <path d="M47 80 L51 16 L67 16 L71 80 Z" fill="#245c7d" stroke="#bae6fd" strokeWidth="1.5" />
                    <path d="M78 80 L84 20 L98 20 L106 80 Z" fill="#1e4d68" stroke="#7dd3fc" strokeWidth="1.5" />
                    <rect x="20" y="34" width="18" height="12" rx="3" fill="#f9bd43" />
                    <rect x="50" y="28" width="18" height="12" rx="3" fill="#38bdf8" />
                    <rect x="80" y="34" width="18" height="12" rx="3" fill="#f9bd43" />
                    <circle cx="59" cy="68" r="11" fill="#0f293a" stroke="#f6c665" strokeWidth="3" />
                    <rect x="55" y="50" width="8" height="16" rx="3" fill="#f6c665" />
                  </svg>
                </div>
              </div>

              <div className="game-card-body">
                <div>
                  <p className="game-subtitle text-cyan-300">三路連環門 · 識破誘餌門推線</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-white">數學神炮：雪地三路</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  判斷左中右三條跑道連環運算結果，識破誘餌門並發射藍軍炮陣壓制紅軍！（附老師設定面板）
                </p>
                <div className="game-tags" aria-label="涵蓋訓練項目">
                  <span className="game-tag">加減混合</span>
                  <span className="game-tag">加減乘混合</span>
                  <span className="game-tag">三路連環（防誘餌）</span>
                  <span className="game-tag">老師設定面板</span>
                </div>
                <span className="game-card-action">
                  進入《數學神炮：雪地三路》 <ArrowRight size={18} aria-hidden="true" />
                </span>
              </div>
            </a>
          </div>
        </section>

        <section className="hub-guide mt-6" aria-label="快速揀選指南">
          <div className="flex items-center gap-2 text-xs font-black tracking-wide text-amber-200 mb-3">
            <Compass size={15} aria-hidden="true" />
            <span>快速揀選指南 · 按練習重點配對遊戲</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs leading-relaxed">
            <div className="hub-guide-item">
              <strong className="text-sky-200">練心算求值與乘法表</strong>
              <p className="mt-0.5 text-slate-300">《橋樑算術衝鋒》：20 題闖關，練 20–100 加法、數感與 2–9 乘法。</p>
            </div>
            <div className="hub-guide-item">
              <strong className="text-teal-200">短時間快答與反應</strong>
              <p className="mt-0.5 text-slate-300">《星光燈塔保衛戰》：10 題緊湊守塔，適合課堂熱身或快答反應。</p>
            </div>
            <div className="hub-guide-item">
              <strong className="text-amber-200">雙門比較與三牆破陣</strong>
              <p className="mt-0.5 text-slate-300">《數學大軍：攻城救公主》：比左右門兵力增幅，連戰多層巨人救公主。</p>
            </div>
            <div className="hub-guide-item">
              <strong className="text-cyan-200">三路多步算式與防誘餌</strong>
              <p className="mt-0.5 text-slate-300">《數學神炮：雪地三路》：左中右三路疊加運算，避免誤入最大數誘餌。</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
