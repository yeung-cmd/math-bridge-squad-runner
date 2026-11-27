import React from 'react';
import { AnswerRecord, QuestionModeConfig, QuestionModeId, WeaponInfo } from '../types/game';
import { QUESTION_MODES } from '../utils/questionGenerator';
import { MissionProgress } from '../utils/missions';
import { Star, RotateCcw, CheckCircle2, XCircle, Trophy, ArrowLeft } from 'lucide-react';

interface SummaryViewProps {
  modeConfig: QuestionModeConfig;
  score: number;
  troops: number;
  weapon: WeaponInfo;
  records: AnswerRecord[];
  victory: boolean;
  missionProgress: MissionProgress[];
  onPlayAgain: () => void;
  onSwitchMode: (modeId: QuestionModeId) => void;
  onReturnSettings?: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  modeConfig,
  score,
  troops,
  weapon,
  records,
  victory,
  missionProgress,
  onPlayAgain,
  onSwitchMode,
  onReturnSettings
}) => {
  const correctCount = records.filter((r) => r.isCorrect).length;
  const stars =
    correctCount >= 18 && victory ? 3 : correctCount >= 12 ? 2 : correctCount >= 6 ? 1 : 0;

  return (
    <div className="relative w-full flex-1 min-h-0 bg-[#152238] text-white flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-[#1D2D49] border-2 border-white/80 rounded-2xl p-4 text-center shadow-lg shrink-0">
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3].map((idx) => (
            <Star
              key={idx}
              className={`w-7 h-7 ${
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
          題庫：{modeConfig.title} · 答啱 {correctCount} / {records.length} 題
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

      <section aria-label="本關任務結果" className="rounded-xl border border-white/15 bg-[#0F1829] p-3 shrink-0">
        <h3 className="mb-2 text-xs font-black text-amber-200">本關任務</h3>
        <div className="grid grid-cols-3 gap-2">
          {missionProgress.map((mission) => (
            <div key={mission.id} className={`rounded-lg border p-2 text-center ${mission.complete ? 'border-emerald-400/50 bg-emerald-950/50' : 'border-white/10 bg-slate-900/70'}`}>
              <div className={`text-xs font-black ${mission.complete ? 'text-emerald-300' : 'text-slate-200'}`}>
                {mission.complete ? '✓ ' : ''}{mission.title}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">
                {mission.complete ? '已完成' : mission.id === 'boss' ? '未完成' : `${mission.value}/${mission.target}`}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Question Review List */}
      <div className="flex flex-col min-h-[165px] max-h-[240px] bg-[#0F1829] border border-white/15 rounded-xl p-3 shrink-0">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 shrink-0">
          <span>作答紀錄回顧</span>
          <span>答對率 {Math.round((correctCount / Math.max(1, records.length)) * 100)}%</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
          {records.map((rec) => (
            <div
              key={rec.questionIndex}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                rec.isCorrect
                  ? 'bg-emerald-950/60 border border-emerald-500/30'
                  : 'bg-rose-950/60 border border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {rec.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="font-bold text-slate-200 truncate">
                  Q{rec.questionIndex}. {rec.prompt}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 tabular-nums">
                {!rec.isCorrect && (
                  <span className="text-rose-400 line-through">
                    {rec.chosenAnswer === null ? '未作答' : `${rec.chosenAnswer}`}
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
      <div className="space-y-2.5 shrink-0 pb-1">
        <div className={`grid gap-2 ${onReturnSettings ? 'grid-cols-[1fr_1.45fr]' : 'grid-cols-1'}`}>
          {onReturnSettings && (
            <button
              type="button"
              onClick={onReturnSettings}
              className="py-2.5 px-3 rounded-2xl bg-[#1D2D49] border-2 border-white/25 hover:border-white/50 text-white font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              返回設定
            </button>
          )}
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-b from-[#FBD148] to-[#F3AE1B] border-[2.5px] border-[#1B2538] shadow-[0_3px_0_#1B2538] active:translate-y-0.5 text-[#3B2606] font-black text-base flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            再玩一次
          </button>
        </div>

        {/* Quick Mode Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {(Object.keys(QUESTION_MODES) as QuestionModeId[]).map((mId) => {
            const m = QUESTION_MODES[mId];
            const isCurrent = mId === modeConfig.id;
            return (
              <button
                key={mId}
                type="button"
                onClick={() => onSwitchMode(mId)}
                className={`py-2 px-2 rounded-xl font-bold text-[11px] border transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap ${
                  isCurrent
                    ? 'bg-sky-600 text-white border-white'
                    : 'bg-[#1D2D49] text-slate-200 border-white/20 hover:border-white/60'
                }`}
              >
                <Trophy className="w-3 h-3 text-amber-300 shrink-0" />
                {m.shortTitle}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
