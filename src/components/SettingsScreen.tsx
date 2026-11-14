import React from 'react';
import { Play, Check, Clock, Volume2, VolumeX, ArrowRight, Sparkles } from 'lucide-react';
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
  progress: ProgressMap;
  onStart: () => void;
}

export function SettingsScreen(props: Props) {
  return <div className="setup-shell min-h-svh text-white px-4 py-8 sm:py-12">
    <main className="page-enter w-full max-w-4xl mx-auto">
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-cyan-200 text-sm tracking-widest font-bold mb-4"><Sparkles size={18} /> 數學冒險，準備出發</div>
        <h1 className="text-3xl sm:text-5xl font-black leading-tight">數學橋樑<br className="sm:hidden" />軍團大作戰</h1>
        <p className="text-slate-300 mt-4">選好題目和速度，帶領軍團衝過數學橋樑！</p>
      </header>
      <div className="grid md:grid-cols-[1.4fr_1fr] gap-5">
        <section className="setup-card p-5 sm:p-6" aria-labelledby="mode-title">
          <h2 id="mode-title" className="text-lg font-black mb-1"><span className="step-number">1</span> 選擇題目範圍</h2>
          <p className="text-sm text-slate-400 mb-5">每關 20 題，完成後挑戰守關首領。</p>
          <div className="grid gap-3">
            {(Object.keys(QUESTION_MODES) as QuestionModeId[]).map((id, index) => {
              const cfg = QUESTION_MODES[id];
              const active = props.selectedMode === id;
              return <button key={id} type="button" aria-pressed={active} onClick={() => props.onSelectMode(id)} className={`mode-card flex items-center gap-4 rounded-2xl p-4 text-left border-2 cursor-pointer ${active ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-slate-950/30 hover:border-white/40'}`}>
                <span className={`text-2xl font-black w-11 h-11 rounded-xl flex items-center justify-center ${active ? 'bg-cyan-300 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{id === 'MULTIPLY_DIGITS' ? '×' : index === 3 ? '?' : '+'}</span>
                <span className="flex-1"><span className="block font-black text-base">{cfg.title}</span><span className="block text-xs text-slate-300 mt-1">{cfg.subtitle}</span><span className="block text-xs text-amber-200 mt-1">最高紀錄 {props.progress[id]?.highScore ?? 0} 分</span></span>
                {active && <Check size={22} className="text-cyan-300" />}
              </button>;
            })}
          </div>
        </section>
        <div className="flex flex-col gap-5">
          <section className="setup-card p-5 sm:p-6" aria-labelledby="speed-title">
            <h2 id="speed-title" className="text-lg font-black mb-4"><span className="step-number">2</span> 設定遊戲速度</h2>
            <p className="text-sm text-slate-300 flex gap-2 items-center mb-3"><Clock size={16} /> 每題思考時間</p>
            <div className="grid grid-cols-4 gap-2">
              {[5, 8, 10, 15].map(sec => <button key={sec} aria-pressed={props.questionDuration === sec} onClick={() => props.onDurationChange(sec)} className={`rounded-xl border-2 py-3 font-black cursor-pointer transition-colors ${props.questionDuration === sec ? 'bg-amber-300 border-amber-100 text-slate-950' : 'bg-slate-900 border-white/15'}`}>{sec}<span className="block text-xs mt-1">秒</span></button>)}
            </div>
            <p className="text-xs text-slate-400 mt-3">初次遊玩可選 10 秒或 15 秒，慢慢思考。</p>
            <button onClick={props.onToggleAutoAdvance} aria-pressed={props.autoAdvance} className="flex items-center justify-between gap-3 w-full p-3 mt-5 rounded-xl bg-slate-950/40 text-sm text-left cursor-pointer"><span>選好跑道後自動衝刺</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${props.autoAdvance ? 'bg-cyan-300 text-slate-950' : 'bg-slate-700'}`}>{props.autoAdvance ? '開啟' : '關閉'}</span></button>
            <button onClick={props.onToggleMute} className="flex items-center justify-between w-full p-3 mt-2 rounded-xl bg-slate-950/40 text-sm cursor-pointer"><span>音效及背景音樂</span>{props.muted ? <VolumeX size={20} /> : <Volume2 size={20} className="text-cyan-300" />}</button>
          </section>
          <section className="setup-card p-5 text-sm text-slate-300">
            <h2 className="font-black text-white mb-3">怎樣遊玩？</h2>
            <p className="leading-7">閱讀題目 <ArrowRight className="inline mx-1" size={14} /> 選擇左右跑道<br />按「前進」衝線，答對可增加士兵和升級武器。</p>
            <p className="text-xs text-slate-400 mt-3">鍵盤：← → 選擇跑道，空白鍵前進。</p>
          </section>
        </div>
      </div>
      <div className="mt-6 text-center">
        <button type="button" onClick={props.onStart} className="start-button inline-flex justify-center items-center gap-3 rounded-2xl bg-amber-300 text-slate-950 px-12 py-4 text-xl font-black cursor-pointer w-full sm:w-auto"><Play className="fill-current" /> 開始遊戲</button>
        <p className="text-xs text-slate-400 mt-4">{QUESTION_MODES[props.selectedMode].title} · 每題 {props.questionDuration} 秒 · 20 題</p>
      </div>
    </main>
  </div>;
}
