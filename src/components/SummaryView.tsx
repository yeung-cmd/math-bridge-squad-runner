import React from 'react';
import { AnswerRecord, QuestionModeConfig, QuestionModeId, WeaponInfo } from '../types/game';
import { QUESTION_MODES } from '../utils/questionGenerator';
import { Star, RotateCcw, CheckCircle2, XCircle, Trophy } from 'lucide-react';

interface SummaryViewProps {
  modeConfig: QuestionModeConfig;
  score: number;
  troops: number;
  weapon: WeaponInfo;
  records: AnswerRecord[];
  victory: boolean;
  onPlayAgain: () => void;
  onSwitchMode: (modeId: QuestionModeId) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  modeConfig,
  score,
  troops,
  weapon,
  records,
  victory,
  onPlayAgain,
  onSwitchMode
}) => {
  const correctCount = records.filter((r) => r.isCorrect).length;
  const stars =
    correctCount >= 18 && victory ? 3 : correctCount >= 12 ? 2 : correctCount >= 6 ? 1 : 0;

  return (
    <div className="relative w-full h-full bg-[#152238] text-white flex flex-col justify-between p-4 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-[#1D2D49] border-[3px] border-white rounded-2xl p-4 text-center shadow-lg">
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3].map((idx) => (
            <Star
              key={idx}
              className={`w-8 h-8 ${
                idx <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  : 'text-slate-600 fill-slate-700'
              }`}
            />
          ))}
        </div>
        <h2 className="text-2xl font-black tracking-wide text-white">
          {victory ? '闖關大獲全勝！' : '完成挑戰！繼續加油'}
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          當前題庫：{modeConfig.title} · 答啱 {correctCount} / {records.length} 題
        </p>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/15">
          <div>
            <div className="text-[11px] text-slate-400">最終得分</div>
            <div className="font-display font-black text-lg text-amber-400 tabular-nums">
              {score}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">最終士兵</div>
            <div className="font-display font-black text-lg text-sky-400 tabular-nums">
              {troops}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">達成武器</div>
            <div className="font-bold text-xs text-orange-300 truncate mt-1">
              {weapon.name}
            </div>
          </div>
        </div>
      </div>

      {/* Question Review List */}
      <div className="my-3 flex-1 min-h-0 bg-[#0F1829] border border-white/15 rounded-xl p-3 overflow-y-auto">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
          <span>作答紀錄回顧</span>
          <span>答對率 {Math.round((correctCount / Math.max(1, records.length)) * 100)}%</span>
        </div>
        <div className="space-y-1.5">
          {records.map((rec) => (
            <div
              key={rec.questionIndex}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                rec.isCorrect
                  ? 'bg-emerald-950/60 border border-emerald-500/30'
                  : 'bg-rose-950/60 border border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {rec.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="font-bold text-slate-200">
                  Q{rec.questionIndex}. {rec.prompt}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 tabular-nums">
                {!rec.isCorrect && (
                  <span className="text-rose-400 line-through">
                    你揀: {rec.chosenAnswer}
                  </span>
                )}
                <span className="font-black text-amber-300">
                  答案: {rec.correctAnswer}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full py-3 rounded-full bg-gradient-to-b from-[#FBD148] to-[#F3AE1B] border-[3px] border-[#1B2538] shadow-[0_4px_0_#1B2538] active:translate-y-0.5 text-[#3B2606] font-black text-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          再玩一次 ({modeConfig.title})
        </button>

        {/* Quick Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(QUESTION_MODES) as QuestionModeId[]).map((mId) => {
            const m = QUESTION_MODES[mId];
            const isCurrent = mId === modeConfig.id;
            return (
              <button
                key={mId}
                type="button"
                onClick={() => onSwitchMode(mId)}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs border-2 transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                  isCurrent
                    ? 'bg-sky-600 text-white border-white'
                    : 'bg-[#1D2D49] text-slate-200 border-white/25 hover:border-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                {m.title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
