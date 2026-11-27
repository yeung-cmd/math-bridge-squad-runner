import React from 'react';
import { Play, Check, Clock, Volume2, VolumeX, ArrowRight, Sparkles, Star } from 'lucide-react';
import { QUESTION_MODES } from '../utils/questionGenerator';
import { ProgressMap, QuestionModeId } from '../types/game';

interface Props {
  selectedMode: QuestionModeId;
  onSelectMode: (id: QuestionModeId) => void;
  questionDuration: number;
  onDurationChange: (seconds: number) => void;
  muted: boolean;
  onToggleMute: () => void;
  autoAdvance: boolean;
  onToggleAutoAdvance: () => void;
  progress?: ProgressMap;
  game?: 'bridge' | 'rescue';
  onChooseGame: () => void;
  starting?: boolean;
  onStart: () => void;
}

export function SettingsScreen(props: Props) {
  const isRescue = props.game === 'rescue';
  const count = isRescue ? 10 : 20;
  const modes = (Object.keys(QUESTION_MODES) as QuestionModeId[]).filter(id => !isRescue || id !== 'MULTIPLY_DIGITS');

  return (
    <div className="setup-shell min-h-svh text-white px-4 py-6 sm:py-10" data-theme={isRescue ? 'rescue' : 'bridge'}>
      <main className="page-enter w-full max-w-4xl mx-auto">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={props.onChooseGame}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-slate-900/55 px-4 py-2 text-sm font-bold hover:bg-white/10 cursor-pointer"
          >
            ← 返回遊戲大廳
          </button>
          <span
            className={`rounded-full border px-3.5 py-1 text-xs font-black tracking-wide ${
              isRescue
                ? 'border-teal-300/40 bg-teal-400/15 text-teal-200'
                : 'border-sky-300/40 bg-sky-400/15 text-sky-200'
            }`}
          >
            {isRescue ? '遊戲 02 · 2D 科幻守塔' : '遊戲 01 · 2D 跑道求值'}
          </span>
        </div>

        <header className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 text-cyan-200 text-xs sm:text-sm tracking-widest font-bold mb-3">
            <Sparkles size={16} aria-hidden="true" />
            <span>{isRescue ? '限時快答 · 能量護塔防衛' : '算式計值 · 軍團跑道對戰'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight">
            {isRescue ? '星光燈塔保衛戰' : '橋樑算術衝鋒'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-xl mx-auto">
            {isRescue
              ? '選好題庫範圍與每題限時，發射能量波擊退怪物並點亮五層燈塔。'
              : '選好題庫範圍與衝刺時間，答對問題擴大軍團、升級武器並決戰守關首領！'}
          </p>
        </header>

        <div className="grid md:grid-cols-[1.45fr_1fr] gap-5">
          <section className="setup-card p-5 sm:p-6" aria-labelledby="mode-title">
            <h2 id="mode-title" className="text-lg font-black mb-1">
              <span className="step-number">1</span> 選擇題庫範圍
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              每關 {count} 題，完成後{isRescue ? '依答對題數點亮燈塔。' : '與守關首領正面對決。'}
            </p>
            <div className="grid gap-2.5">
              {modes.map((id, index) => {
                const cfg = QUESTION_MODES[id];
                const active = props.selectedMode === id;
                const rec = props.progress?.[id];
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => props.onSelectMode(id)}
                    className={`mode-card flex items-center gap-3.5 rounded-2xl p-3.5 sm:p-4 text-left border-2 cursor-pointer ${
                      active
                        ? 'border-cyan-300 bg-cyan-400/15 shadow-[0_0_24px_rgba(34,211,238,0.14)]'
                        : 'border-white/10 bg-slate-950/35 hover:border-white/35'
                    }`}
                  >
                    <span
                      className={`text-2xl font-black w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${
                        active ? 'bg-cyan-300 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {id === 'MULTIPLY_DIGITS' ? '×' : index === 3 ? '?' : '+'}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-base text-white">{cfg.title}</span>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold text-cyan-200">
                          {cfg.rangeLabel}
                        </span>
                      </span>
                      <span className="block text-xs text-slate-300 mt-1">{cfg.subtitle}</span>
                      {rec && (
                        <span className="flex items-center gap-2 text-xs text-amber-200 mt-1.5 font-bold">
                          <span className="inline-flex items-center gap-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                className={s <= rec.stars ? 'fill-amber-300 text-amber-300' : 'text-slate-600'}
                              />
                            ))}
                          </span>
                          <span>最高紀錄 {rec.highScore} 分</span>
                        </span>
                      )}
                    </span>
                    {active && <Check size={22} className="text-cyan-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-5">
            <section className="setup-card p-5 sm:p-6" aria-labelledby="speed-title">
              <h2 id="speed-title" className="text-lg font-black mb-4">
                <span className="step-number">2</span> 設定速度與操作
              </h2>
              <p className="text-sm text-slate-300 flex gap-2 items-center mb-3">
                <Clock size={16} /> 每題思考時間
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 8, 10, 15].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    aria-pressed={props.questionDuration === sec}
                    onClick={() => props.onDurationChange(sec)}
                    className={`rounded-xl border-2 py-2.5 font-black cursor-pointer transition-colors ${
                      props.questionDuration === sec
                        ? 'bg-amber-300 border-amber-100 text-slate-950'
                        : 'bg-slate-900 border-white/15 hover:border-white/35'
                    }`}
                  >
                    {sec}
                    <span className="block text-xs mt-0.5">秒</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2.5">初次遊玩建議選 10 秒或 15 秒，熟練後再挑戰 5 秒。</p>

              <button
                type="button"
                onClick={props.onToggleAutoAdvance}
                aria-pressed={props.autoAdvance}
                className="flex items-center justify-between gap-3 w-full p-3 mt-4 rounded-xl border border-white/10 bg-slate-950/45 hover:border-white/25 text-sm text-left cursor-pointer"
              >
                <span className="font-bold">{isRescue ? '選好答案後自動確認' : '選好跑道後自動衝刺'}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${props.autoAdvance ? 'bg-cyan-300 text-slate-950' : 'bg-slate-700 text-slate-200'}`}>
                  {props.autoAdvance ? '開啟' : '關閉'}
                </span>
              </button>

              <button
                type="button"
                onClick={props.onToggleMute}
                className="flex items-center justify-between w-full p-3 mt-2.5 rounded-xl border border-white/10 bg-slate-950/45 hover:border-white/25 text-sm font-bold cursor-pointer"
              >
                <span>{isRescue ? '遊戲音效' : '音效及背景音樂'}</span>
                {props.muted ? <VolumeX size={20} className="text-slate-400" /> : <Volume2 size={20} className="text-cyan-300" />}
              </button>
            </section>

            <section className="setup-card p-5 text-sm text-slate-300">
              <h2 className="font-black text-white mb-2.5">操作步驟</h2>
              <ol className="space-y-1.5 text-xs sm:text-sm leading-relaxed list-decimal list-inside">
                <li>閱讀題目並心算答案</li>
                <li>點選對應的左或右跑道 <ArrowRight className="inline mx-0.5" size={13} /> {isRescue ? '按「確認並發射」' : '按「前進」'}</li>
                <li>{isRescue ? '答對可連射能量彈擊退怪物；答錯或超時會有增援。' : '答對可增兵、發射齊射並升級武器；答錯或超時會有增援。'}</li>
              </ol>
              <p className="text-xs text-slate-400 mt-3 pt-2.5 border-t border-white/10">
                {isRescue ? '鍵盤捷徑：← → 選擇跑道，空白鍵確認發射。' : '鍵盤捷徑：← → 選擇跑道，空白鍵全速前進。'}
              </p>
            </section>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={props.starting}
            onClick={props.onStart}
            className="start-button inline-flex justify-center items-center gap-3 rounded-2xl bg-amber-300 text-slate-950 px-12 py-4 text-xl font-black cursor-pointer w-full sm:w-auto"
          >
            <Play className="fill-current" />
            {props.starting ? '正在載入場景…' : '開始遊戲'}
          </button>
          <p className="text-xs text-slate-400 mt-3.5">
            {QUESTION_MODES[props.selectedMode].title} · 每題 {props.questionDuration} 秒 · 共 {count} 題
          </p>
        </div>
      </main>
    </div>
  );
}
