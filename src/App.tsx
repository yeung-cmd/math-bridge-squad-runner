/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AnswerRecord,
  GameState,
  Lane,
  ProgressMap,
  QuestionItem,
  QuestionModeId
} from './types/game';
import {
  generateQuestionSet,
  getWeaponForCorrectCount,
  QUESTION_MODES,
  WEAPON_TIERS
} from './utils/questionGenerator';
import { soundFX } from './utils/sound';
import { BridgeScene } from './components/BridgeScene';
import { BossBattleView } from './components/BossBattleView';
import { SummaryView } from './components/SummaryView';
import { PauseModal, QUESTION_TIME_OPTIONS } from './components/PauseModal';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Trophy,
  Check,
  Clock,
  FastForward
} from 'lucide-react';

const STORAGE_KEY = 'math_bridge_squad_progress_v1';

const DEFAULT_PROGRESS: ProgressMap = {
  ADD_20: { highScore: 520, bestTroops: 26, stars: 3, gamesPlayed: 1 },
  ADD_50: { highScore: 580, bestTroops: 28, stars: 3, gamesPlayed: 1 },
  ADD_100: { highScore: 640, bestTroops: 30, stars: 3, gamesPlayed: 1 },
  NUMBER_SENSE: { highScore: 508, bestTroops: 22, stars: 3, gamesPlayed: 1 }
};

export default function App() {
  const [selectedMode, setSelectedMode] = useState<QuestionModeId>('ADD_20');
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [autoAdvanceOnSelect, setAutoAdvanceOnSelect] = useState<boolean>(false);

  // Per-question running & choosing duration (configurable: 5s, 8s, 10s, 15s)
  const [questionDuration, setQuestionDuration] = useState<number>(8);

  // Questions & current index (0..9)
  const [questions, setQuestions] = useState<QuestionItem[]>(() =>
    generateQuestionSet('ADD_20', 10)
  );
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Squad & HUD state
  const [troops, setTroops] = useState<number>(QUESTION_MODES.ADD_20.initialTroops);
  const [score, setScore] = useState<number>(120);
  const [correctCount, setCorrectCount] = useState<number>(4);
  const [selectedLane, setSelectedLane] = useState<Lane>('LEFT');

  // Gate continuous approach progress (0.0 at horizon -> 1.0 when reaching soldiers)
  const [gateProgress, setGateProgress] = useState<number>(0.12);
  // Whether the player hit "前進" to turbo-sprint into the gate
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [impactResult, setImpactResult] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [floatingFeedback, setFloatingFeedback] = useState<{
    text: string;
    subtext?: string;
    isPositive: boolean;
  } | null>(null);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [bossVictory, setBossVictory] = useState<boolean>(true);

  const [progress, setProgress] = useState<ProgressMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PROGRESS;
  });

  const impactTimeoutRef = useRef<number | null>(null);
  const hasTriggeredImpactRef = useRef<boolean>(false);

  const currentModeConfig = QUESTION_MODES[selectedMode];
  const currentQuestion = questions[currentIdx] || questions[0];
  const currentWeapon = getWeaponForCorrectCount(correctCount);

  // Remaining seconds for the current approaching gate
  const questionSecondsLeft = Math.max(
    0,
    (1 - Math.min(1, gateProgress)) * questionDuration
  );

  // Save progress helper
  const updateModeProgress = useCallback(
    (modeId: QuestionModeId, finalScore: number, finalTroops: number, stars: number) => {
      setProgress((prev) => {
        const curr = prev[modeId] || {
          highScore: 0,
          bestTroops: 0,
          stars: 0,
          gamesPlayed: 0
        };
        const updated: ProgressMap = {
          ...prev,
          [modeId]: {
            highScore: Math.max(curr.highScore, finalScore),
            bestTroops: Math.max(curr.bestTroops, finalTroops),
            stars: Math.max(curr.stars, stars),
            gamesPlayed: curr.gamesPlayed + 1
          }
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    []
  );

  // Start a fresh game in the specified mode
  const startNewGame = useCallback((modeId: QuestionModeId) => {
    if (impactTimeoutRef.current) {
      window.clearTimeout(impactTimeoutRef.current);
    }
    hasTriggeredImpactRef.current = false;
    const cfg = QUESTION_MODES[modeId];
    const newQuestions = generateQuestionSet(modeId, 10);
    setSelectedMode(modeId);
    setQuestions(newQuestions);
    setCurrentIdx(0);
    setTroops(cfg.initialTroops);
    setScore(100);
    setCorrectCount(4); // Equip 重裝散彈槍 by default
    setSelectedLane('LEFT');
    setGateProgress(0.05);
    setIsAdvancing(false);
    setImpactResult(null);
    setFloatingFeedback(null);
    setRecords([]);
    setGameState('PLAYING');
    setIsPaused(false);
  }, []);

  // Load the exact screenshot state ("Q 5/10", "8 的前一個數是？", Troops 22, Score 508, 重裝散彈槍)
  const loadScreenshotReplicaState = useCallback(() => {
    if (impactTimeoutRef.current) {
      window.clearTimeout(impactTimeoutRef.current);
    }
    hasTriggeredImpactRef.current = false;
    const newQuestions = generateQuestionSet('NUMBER_SENSE', 10);
    newQuestions[4] = {
      id: 5,
      index: 5,
      prompt: '8 的前一個數是？',
      leftOption: 8,
      rightOption: 7,
      correctLane: 'RIGHT',
      correctAnswer: 7,
      wrongAnswer: 8,
      rewardTroops: 3,
      penaltyTroops: 2
    };
    setSelectedMode('NUMBER_SENSE');
    setQuestions(newQuestions);
    setCurrentIdx(4); // Q 5/10
    setTroops(22);
    setScore(508);
    setCorrectCount(4); // 重裝散彈槍
    setSelectedLane('RIGHT'); // Hand pointing at 7 on the right
    setGateProgress(0.32); // Positioned right at the screenshot gate distance
    setIsAdvancing(false);
    setImpactResult(null);
    setFloatingFeedback(null);
    setRecords([
      {
        questionIndex: 1,
        prompt: '5 的後一個數是？',
        chosenAnswer: 6,
        correctAnswer: 6,
        isCorrect: true,
        troopsDelta: 2
      },
      {
        questionIndex: 2,
        prompt: '10 的前一個數是？',
        chosenAnswer: 9,
        correctAnswer: 9,
        isCorrect: true,
        troopsDelta: 2
      },
      {
        questionIndex: 3,
        prompt: '12 的後一個數是？',
        chosenAnswer: 13,
        correctAnswer: 13,
        isCorrect: true,
        troopsDelta: 2
      },
      {
        questionIndex: 4,
        prompt: '6 的前一個數是？',
        chosenAnswer: 5,
        correctAnswer: 5,
        isCorrect: true,
        troopsDelta: 2
      }
    ]);
    setGameState('PLAYING');
    setIsPaused(false);
  }, []);

  // Resolve impact when gateProgress reaches 1.0 (soldiers smash through the gate!)
  const resolveGateImpact = useCallback(() => {
    if (hasTriggeredImpactRef.current) return;
    hasTriggeredImpactRef.current = true;

    const activeLane = selectedLane || 'LEFT';
    const chosenAnswer =
      activeLane === 'LEFT'
        ? currentQuestion.leftOption
        : currentQuestion.rightOption;
    const isCorrect = activeLane === currentQuestion.correctLane;

    setImpactResult(isCorrect ? 'CORRECT' : 'WRONG');

    if (isCorrect) {
      const prevWeapon = getWeaponForCorrectCount(correctCount);
      const nextCorrectCount = correctCount + 1;
      const nextWeapon = getWeaponForCorrectCount(nextCorrectCount);
      const gainedTroops = currentQuestion.rewardTroops;
      const gainedScore = Math.round(85 * nextWeapon.multiplier);

      setTroops((t) => t + gainedTroops);
      setScore((s) => s + gainedScore);
      setCorrectCount(nextCorrectCount);

      if (nextWeapon.tier > prevWeapon.tier) {
        soundFX.playWeaponUpgrade();
        setFloatingFeedback({
          text: `+${gainedTroops} 士兵`,
          subtext: `武器升級：${nextWeapon.name}！`,
          isPositive: true
        });
      } else {
        soundFX.playCorrectGate();
        setFloatingFeedback({
          text: `+${gainedTroops} 士兵`,
          subtext: `+${gainedScore} 分`,
          isPositive: true
        });
      }
    } else {
      soundFX.playWrongGate();
      const lostTroops = currentQuestion.penaltyTroops;
      setTroops((t) => Math.max(1, t - lostTroops));
      setCorrectCount((c) => Math.max(0, c - 1));
      setFloatingFeedback({
        text: `-${lostTroops} 士兵`,
        subtext: `正確答案係 ${currentQuestion.correctAnswer}`,
        isPositive: false
      });
    }

    setRecords((prev) => [
      ...prev,
      {
        questionIndex: currentQuestion.index,
        prompt: currentQuestion.prompt,
        chosenAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
        troopsDelta: isCorrect
          ? currentQuestion.rewardTroops
          : -currentQuestion.penaltyTroops
      }
    ]);

    // After short celebration/feedback, spawn the next gate at the horizon!
    impactTimeoutRef.current = window.setTimeout(() => {
      setIsAdvancing(false);
      setImpactResult(null);
      setFloatingFeedback(null);

      if (currentIdx + 1 >= questions.length) {
        setGameState('BOSS_FIGHT');
      } else {
        hasTriggeredImpactRef.current = false;
        setGateProgress(0.04);
        setCurrentIdx((idx) => idx + 1);
      }
    }, 580);
  }, [selectedLane, currentQuestion, correctCount, currentIdx, questions.length]);

  // Continuous 60fps running & gate approach loop
  useEffect(() => {
    if (gameState !== 'PLAYING' || isPaused || impactResult !== null) return;

    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setGateProgress((prev) => {
        if (prev >= 1) return 1;
        // Normal running speed takes `questionDuration` seconds; clicking "前進" sprints 6x faster!
        const speed = isAdvancing ? 2.4 : 1 / questionDuration;
        const next = prev + dt * speed;
        if (next >= 1) {
          return 1;
        }
        return next;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [gameState, isPaused, impactResult, isAdvancing, questionDuration]);

  // Trigger gate impact as soon as gateProgress reaches 1
  useEffect(() => {
    if (gateProgress >= 1 && gameState === 'PLAYING' && !impactResult) {
      resolveGateImpact();
    }
  }, [gateProgress, gameState, impactResult, resolveGateImpact]);

  // Clicking "前進" turbo-sprints the squad through the gate immediately
  const handleAdvance = useCallback(() => {
    if (gameState !== 'PLAYING' || isPaused || isAdvancing || impactResult) return;
    soundFX.playAdvanceCharge();
    setIsAdvancing(true);
  }, [gameState, isPaused, isAdvancing, impactResult]);

  // Selecting Left or Right lane
  const handleSelectLane = useCallback(
    (lane: Lane) => {
      if (gameState !== 'PLAYING' || isPaused || impactResult) return;
      soundFX.playLaneSelect();
      setSelectedLane(lane);
      if (autoAdvanceOnSelect) {
        setIsAdvancing(true);
      }
    },
    [gameState, isPaused, impactResult, autoAdvanceOnSelect]
  );

  // Keyboard navigation (Left/Right arrows to select lane, Space/Enter to turbo-sprint)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING' || isPaused || impactResult) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleSelectLane('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleSelectLane('RIGHT');
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, isPaused, impactResult, handleSelectLane, handleAdvance]);

  const handleToggleMute = () => {
    soundFX.muted = !muted;
    setMuted(!muted);
  };

  const handleBossBattleComplete = useCallback(
    (victory: boolean, bossBonusScore: number) => {
      const finalScore = score + bossBonusScore + 150;
      setScore(finalScore);
      setBossVictory(victory);
      const totalCorrect = records.filter((r) => r.isCorrect).length;
      const earnedStars =
        totalCorrect >= 9 && victory
          ? 3
          : totalCorrect >= 6
          ? 2
          : totalCorrect >= 3
          ? 1
          : 0;
      updateModeProgress(selectedMode, finalScore, troops, earnedStars);
      setGameState('SUMMARY');
    },
    [score, records, updateModeProgress, selectedMode, troops]
  );

  const timeProgressPercent = Math.max(
    0,
    Math.min(100, (1 - gateProgress) * 100)
  );

  return (
    <div className="min-h-screen w-full bg-[#0B1320] text-white flex flex-col lg:flex-row items-center justify-center lg:gap-8 p-2 sm:p-4">
      {/* LEFT / TOP MODE & RUNNING TIME SELECTOR PANEL */}
      <aside className="w-full max-w-[420px] lg:max-w-[365px] mb-2.5 lg:mb-0 flex flex-col gap-3">
        {/* Brand & Controls Card */}
        <div className="bg-[#152238] border-2 border-white/20 rounded-2xl p-3.5 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                數學橋樑軍團大作戰
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                士兵持續向前奔跑 · 限時揀選正確答案跑道
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label="切換音效"
              className="p-2 rounded-xl bg-[#1E304E] hover:bg-[#283F66] border border-white/20 text-amber-300 cursor-pointer shrink-0"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Per-Question Running Decision Time Setting (5s / 8s / 10s / 15s) */}
          <div className="mt-3 pt-2.5 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                每題跑動選擇時間設定：
              </span>
              <span className="text-white font-black tabular-nums">
                {questionDuration} 秒 / 題
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {QUESTION_TIME_OPTIONS.map((sec) => {
                const active = questionDuration === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setQuestionDuration(sec);
                      setGateProgress(0.05);
                    }}
                    className={`py-1.5 rounded-xl font-display font-black text-xs border-2 transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-400 text-slate-950 border-white shadow'
                        : 'bg-[#0F192A] text-slate-200 border-white/15 hover:border-white/50'
                    }`}
                  >
                    {sec} 秒
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Question Mode Buttons */}
          <div className="mt-3 pt-2.5 border-t border-white/10">
            <div className="text-xs font-bold text-amber-300 mb-2 flex items-center justify-between">
              <span>選擇題目範圍（點擊即換題庫）：</span>
              <span className="text-[11px] text-slate-300 font-normal">共 10 題/關</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {(Object.keys(QUESTION_MODES) as QuestionModeId[]).map((modeId) => {
                const cfg = QUESTION_MODES[modeId];
                const isSelected = selectedMode === modeId;
                const modeStat = progress[modeId];

                return (
                  <button
                    key={modeId}
                    type="button"
                    onClick={() => startNewGame(modeId)}
                    className={`group relative px-3 py-2 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1973F3] border-white shadow-[0_3px_0_#0D47A1]'
                        : 'bg-[#0F192A] border-white/15 hover:border-white/50'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-white truncate">
                          {cfg.title}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-200/80 truncate hidden sm:block">
                        {cfg.subtitle}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-bold text-amber-300 tabular-nums">
                        {cfg.rangeLabel}
                      </div>
                      <div className="text-[10px] text-slate-300 tabular-nums hidden sm:block">
                        最高 {modeStat?.highScore ?? 0} 分
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Demo Button to match exact screenshot Q 5/10 */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={loadScreenshotReplicaState}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              還原原圖示範 (Q 5/10)
            </button>

            <button
              type="button"
              onClick={() => startNewGame(selectedMode)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/20 text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重開本關
            </button>
          </div>
        </div>

        {/* Desktop Weapon Arsenal & Rules Card */}
        <div className="hidden lg:block bg-[#152238] border-2 border-white/20 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              軍團武器進化階梯
            </h2>
            <span className="text-xs text-slate-300 tabular-nums">
              已答啱 {correctCount} 題
            </span>
          </div>
          <div className="space-y-1.5">
            {WEAPON_TIERS.map((w) => {
              const isCurrent = currentWeapon.tier === w.tier;
              const isUnlocked = correctCount >= w.minCorrect;
              return (
                <div
                  key={w.tier}
                  className={`px-3 py-1.5 rounded-xl flex items-center justify-between text-xs border ${
                    isCurrent
                      ? 'bg-[#1E3458] border-amber-400 text-white font-bold'
                      : isUnlocked
                      ? 'bg-[#101C30] border-white/10 text-slate-300'
                      : 'bg-[#0C1524] border-transparent text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: w.color }}
                    />
                    <span>{w.name}</span>
                  </div>
                  <span className="tabular-nums font-display text-[11px]">
                    戰力 x{w.multiplier}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* CENTER: 1:1 ARCADE BRIDGE GAME VIEWPORT */}
      <main className="relative w-full max-w-[412px] h-[690px] sm:h-[735px] rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.65)] border-[4px] border-[#1E293B] bg-[#38A7F8] flex flex-col shrink-0">
        {gameState === 'PLAYING' && (
          <>
            {/* Background 2.5D Running Bridge & Approaching Gates Scene */}
            <BridgeScene
              question={currentQuestion}
              troops={troops}
              selectedLane={selectedLane}
              gateProgress={gateProgress}
              isAdvancing={isAdvancing}
              impactResult={impactResult}
              weapon={currentWeapon}
              onSelectLane={handleSelectLane}
              floatingFeedback={floatingFeedback}
            />

            {/* TOP OVERLAY: HUD BAR + CRYSTAL-CLEAR QUESTION BANNER */}
            <div className="relative z-30 pt-2.5 px-2.5 space-y-2 pointer-events-auto">
              {/* Row 1: Pause Button [||] + Dark Pill Status Bar [🛡️ 22 | ⭐ 508 | 💥 重裝散彈槍] */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaused(true)}
                  aria-label="暫停遊戲"
                  className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#F9CA38] to-[#ECA81B] border-[3px] border-[#1A2436] shadow-[0_3px_0_#1A2436] active:translate-y-0.5 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <div className="flex gap-1">
                    <span className="w-1.5 h-4 bg-[#3B2A0C] rounded-xs" />
                    <span className="w-1.5 h-4 bg-[#3B2A0C] rounded-xs" />
                  </div>
                </button>

                <div className="flex-1 h-11 bg-[#1A2436] border-[3px] border-white rounded-2xl px-3.5 flex items-center justify-between shadow-md">
                  {/* Troop Count Badge */}
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
                        fill="#EF4444"
                        stroke="#FDE68A"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 2v20c4.59-1.15 8-5.86 8-10.91V5l-8-3z"
                        fill="#B91C1C"
                      />
                    </svg>
                    <span className="font-display font-black text-[#FACC15] text-lg tabular-nums">
                      {troops}
                    </span>
                  </div>

                  {/* Star Score Badge */}
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        fill="#FACC15"
                      />
                    </svg>
                    <span className="font-display font-black text-[#FACC15] text-lg tabular-nums">
                      {score}
                    </span>
                  </div>

                  {/* Weapon Tier Name Badge */}
                  <div className="flex items-center gap-1 min-w-0">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        d="M12 2l2.2 6.2L20 6l-4.2 5.2L22 14l-6.5 1.2L18 21l-6-4.2L6 21l2.5-5.8L2 14l6.2-2.8L4 6l5.8 2.2L12 2z"
                        fill="#F97316"
                      />
                      <circle cx="12" cy="12" r="3" fill="#FEF08A" />
                    </svg>
                    <span className="font-black text-white text-sm tracking-tight truncate">
                      {currentWeapon.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: UPGRADED HIGH-CLARITY QUESTION BANNER AT THE TOP */}
              <div className="w-full bg-[#131F33] border-[3.5px] border-white rounded-[22px] px-3.5 pt-2 pb-3 shadow-2xl">
                {/* Top Metadata Row: Q 5/10, Mode Title, & Remaining Seconds */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-black text-[#93B4E8] text-sm tracking-wide tabular-nums">
                      Q {currentQuestion.index}/{questions.length}
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      · {currentModeConfig.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-300">
                      倒數
                    </span>
                    <span
                      className={`font-display font-black text-lg tabular-nums ${
                        questionSecondsLeft <= 2.2
                          ? 'text-rose-400 animate-pulse'
                          : 'text-[#4ADE80]'
                      }`}
                    >
                      {questionSecondsLeft.toFixed(1)}秒
                    </span>
                  </div>
                </div>

                {/* Clear Visual Equation Display: Shows "乜嘢加邊個" in Huge Number Blocks! */}
                {currentQuestion.numA !== undefined &&
                currentQuestion.numB !== undefined ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-0.5">
                      {/* First Addend Box */}
                      <div className="min-w-[64px] px-3 py-1 rounded-xl bg-[#1E3252] border-2 border-sky-300/80 shadow-inner flex items-center justify-center">
                        <span className="font-display font-black text-white text-3xl sm:text-4xl tabular-nums tracking-tight">
                          {currentQuestion.numA}
                        </span>
                      </div>

                      {/* Plus Sign */}
                      <span className="font-display font-black text-amber-400 text-3xl sm:text-4xl drop-shadow">
                        +
                      </span>

                      {/* Second Addend Box */}
                      <div className="min-w-[64px] px-3 py-1 rounded-xl bg-[#1E3252] border-2 border-sky-300/80 shadow-inner flex items-center justify-center">
                        <span className="font-display font-black text-white text-3xl sm:text-4xl tabular-nums tracking-tight">
                          {currentQuestion.numB}
                        </span>
                      </div>

                      {/* Equals Sign */}
                      <span className="font-display font-black text-white text-2xl sm:text-3xl">
                        =
                      </span>

                      {/* Question Mark Target Box */}
                      <div className="min-w-[54px] px-2.5 py-1 rounded-xl bg-amber-400 border-2 border-white shadow flex items-center justify-center">
                        <span className="font-display font-black text-slate-950 text-3xl sm:text-4xl">
                          ?
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Classic Number Sense Prompt ("8 的前一個數是？") */
                  <div className="text-center py-1.5">
                    <h2 className="font-display font-black text-white text-2xl sm:text-[28px] tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                      {currentQuestion.prompt}
                    </h2>
                  </div>
                )}

                {/* Per-Question Running Time Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2 border border-white/20">
                  <div
                    style={{ width: `${timeProgressPercent}%` }}
                    className={`h-full transition-none ${
                      questionSecondsLeft <= 2.2
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-emerald-400 to-sky-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* BOTTOM OVERLAY: LANE SELECTION BUTTONS & YELLOW "前進" BUTTON */}
            <div className="relative z-30 mt-auto pb-3.5 px-2.5 flex flex-col items-center pointer-events-auto">
              {/* "選擇跑道" Outlined Label */}
              <div className="mb-2 text-center">
                <span className="stroke-arcade-text font-black text-xl tracking-wider">
                  選擇跑道
                </span>
              </div>

              {/* Two Large Blue Lane Choice Buttons */}
              <div className="w-full grid grid-cols-2 gap-2.5 mb-3">
                {/* Left Option Button */}
                <button
                  type="button"
                  onClick={() => handleSelectLane('LEFT')}
                  className={`relative h-[60px] rounded-2xl bg-[#1A73F0] border-[3.5px] transition-all flex items-center justify-center cursor-pointer active:translate-y-0.5 ${
                    selectedLane === 'LEFT'
                      ? 'border-amber-300 ring-2 ring-amber-300/60 shadow-[0_5px_0_#0D47A1,0_0_15px_rgba(255,255,255,0.5)]'
                      : 'border-white/90 shadow-[0_4px_0_#0F4C9C] opacity-95 hover:opacity-100'
                  }`}
                >
                  <span className="font-display font-black text-white text-2xl sm:text-3xl tabular-nums drop-shadow-[0_2px_1px_rgba(0,0,0,0.3)]">
                    {currentQuestion.leftOption}
                  </span>

                  {selectedLane === 'LEFT' && (
                    <svg
                      className="w-6 h-6 ml-2.5 animate-hand-point drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="#1E293B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                    </svg>
                  )}
                </button>

                {/* Right Option Button */}
                <button
                  type="button"
                  onClick={() => handleSelectLane('RIGHT')}
                  className={`relative h-[60px] rounded-2xl bg-[#1A73F0] border-[3.5px] transition-all flex items-center justify-center cursor-pointer active:translate-y-0.5 ${
                    selectedLane === 'RIGHT'
                      ? 'border-amber-300 ring-2 ring-amber-300/60 shadow-[0_5px_0_#0D47A1,0_0_15px_rgba(255,255,255,0.5)]'
                      : 'border-white/90 shadow-[0_4px_0_#0F4C9C] opacity-95 hover:opacity-100'
                  }`}
                >
                  <span className="font-display font-black text-white text-2xl sm:text-3xl tabular-nums drop-shadow-[0_2px_1px_rgba(0,0,0,0.3)]">
                    {currentQuestion.rightOption}
                  </span>

                  {selectedLane === 'RIGHT' && (
                    <svg
                      className="w-6 h-6 ml-2.5 animate-hand-point drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="#1E293B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Golden-Yellow "前進" (Advance / Turbo Charge) Button */}
              <button
                type="button"
                onClick={handleAdvance}
                disabled={isAdvancing}
                className="w-[56%] h-[54px] rounded-full bg-gradient-to-b from-[#FAD046] via-[#F5BD29] to-[#EAA918] border-[3.5px] border-[#1B2538] shadow-[0_5px_0_#1B2538] active:translate-y-1 active:shadow-[0_2px_0_#1B2538] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="font-black text-[#3F2B08] text-2xl tracking-widest">
                  前進
                </span>
                <FastForward className="w-5 h-5 text-[#3F2B08] fill-current" />
              </button>
            </div>
          </>
        )}

        {/* END OF STAGE BOSS BATTLE VIEW */}
        {gameState === 'BOSS_FIGHT' && (
          <BossBattleView
            modeConfig={currentModeConfig}
            troops={troops}
            weapon={currentWeapon}
            onFinishBattle={handleBossBattleComplete}
          />
        )}

        {/* SUMMARY & QUESTION REVIEW VIEW */}
        {gameState === 'SUMMARY' && (
          <SummaryView
            modeConfig={currentModeConfig}
            score={score}
            troops={troops}
            weapon={currentWeapon}
            records={records}
            victory={bossVictory}
            onPlayAgain={() => startNewGame(selectedMode)}
            onSwitchMode={(mId) => startNewGame(mId)}
          />
        )}

        {/* PAUSE & MODE SWITCH MODAL */}
        {isPaused && (
          <PauseModal
            currentMode={selectedMode}
            questionDuration={questionDuration}
            muted={muted}
            autoAdvanceOnSelect={autoAdvanceOnSelect}
            onResume={() => setIsPaused(false)}
            onRestart={() => startNewGame(selectedMode)}
            onSelectMode={(mId) => startNewGame(mId)}
            onChangeQuestionDuration={(sec) => {
              setQuestionDuration(sec);
              setGateProgress(0.05);
            }}
            onLoadScreenshotDemo={loadScreenshotReplicaState}
            onToggleMute={handleToggleMute}
            onToggleAutoAdvance={() => setAutoAdvanceOnSelect((prev) => !prev)}
          />
        )}
      </main>
    </div>
  );
}
