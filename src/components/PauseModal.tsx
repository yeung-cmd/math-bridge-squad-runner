import React from 'react';
import { QuestionModeId } from '../types/game';
import { QUESTION_MODES } from '../utils/questionGenerator';
import { Play, RotateCcw, Volume2, VolumeX, Sparkles, Clock } from 'lucide-react';

export const QUESTION_TIME_OPTIONS = [5, 8, 10, 15] as const;

interface PauseModalProps {
  currentMode: QuestionModeId;
  questionDuration: number;
  muted: boolean;
  autoAdvanceOnSelect: boolean;
  onResume: () => void;
  onRestart: () => void;
  onSelectMode: (modeId: QuestionModeId) => void;
  onChangeQuestionDuration: (seconds: number) => void;
  onLoadScreenshotDemo: () => void;
  onToggleMute: () => void;
  onToggleAutoAdvance: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  currentMode,
  questionDuration,
  muted,
  autoAdvanceOnSelect,
  onResume,
  onRestart,
  onSelectMode,
  onChangeQuestionDuration,
  onLoadScreenshotDemo,
  onToggleMute,
  onToggleAutoAdvance
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="w-full max-w-[355px] bg-[#182235] border-[3px] border-white rounded-3xl p-4 sm:p-5 text-white shadow-2xl space-y-3.5 max-h-[95%] overflow-y-auto">
        <div className="text-center">
          <h3 className="text-xl font-black tracking-wide">遊戲設定與題庫選擇</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            自訂每題跑動選擇時間與加數範圍
          </p>
        </div>

        {/* Per-Question Running Time Setting (5s / 8s / 10s / 15s) */}
        <div className="bg-[#101929] border border-white/20 rounded-2xl p-3">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              每題跑動選擇時間：
            </span>
            <span className="text-white font-black">{questionDuration} 秒 / 題</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {QUESTION_TIME_OPTIONS.map((sec) => {
              const active = questionDuration === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onChangeQuestionDuration(sec)}
                  className={`py-2 rounded-xl font-display font-black text-xs border-2 transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-400 text-slate-950 border-white shadow'
                      : 'bg-[#18253B] text-slate-200 border-white/15 hover:border-white/50'
                  }`}
                >
                  {sec} 秒
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Selection Buttons */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-amber-300">選擇題目範圍：</div>
          {(Object.keys(QUESTION_MODES) as QuestionModeId[]).map((modeId) => {
            const cfg = QUESTION_MODES[modeId];
            const active = currentMode === modeId;
            return (
              <button
                key={modeId}
                type="button"
                onClick={() => onSelectMode(modeId)}
                className={`w-full px-3.5 py-2 rounded-xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                  active
                    ? 'bg-[#1A73F0] border-white shadow-md'
                    : 'bg-[#101929] border-white/20 hover:border-white/60'
                }`}
              >
                <div>
                  <div className="font-black text-sm text-white">{cfg.title}</div>
                  <div className="text-[11px] text-slate-200/80">{cfg.subtitle}</div>
                </div>
                <span className="text-xs font-bold text-amber-300 shrink-0 ml-2">
                  {active ? '目前模式' : '切換'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Settings Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            className="py-2 px-3 rounded-xl bg-[#101929] border border-white/20 text-xs font-bold flex items-center justify-center gap-1.5 hover:border-white/50 cursor-pointer"
          >
            {muted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                音效：已靜音
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                音效：開啟
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleAutoAdvance}
            className="py-2 px-3 rounded-xl bg-[#101929] border border-white/20 text-xs font-bold flex items-center justify-center gap-1.5 hover:border-white/50 cursor-pointer"
          >
            <span>{autoAdvanceOnSelect ? '選道即加速：開' : '等跑完/撳前進'}</span>
          </button>
        </div>

        {/* Restore Screenshot Demo State Button */}
        <button
          type="button"
          onClick={onLoadScreenshotDemo}
          className="w-full py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-500/30 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          一鍵還原參考圖畫面 (Q 5/10 · 8 的前一個數是？)
        </button>

        {/* Primary Resume / Restart Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onRestart}
            className="py-2.5 rounded-full bg-slate-700 hover:bg-slate-600 border-2 border-white font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            重新開始
          </button>
          <button
            type="button"
            onClick={onResume}
            className="py-2.5 rounded-full bg-gradient-to-b from-[#FBD148] to-[#F3AE1B] border-2 border-[#1B2538] text-[#3B2606] font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            繼續遊戲
          </button>
        </div>
      </div>
    </div>
  );
};
