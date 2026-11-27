/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMotionValue } from 'motion/react';
import { SettingsScreen } from './components/SettingsScreen';
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
  QUESTIONS_PER_LEVEL
} from './utils/questionGenerator';
import { soundFX } from './utils/sound';
import { prepareBridge } from './utils/bridgeField';
import { addReinforcements, createDefense, launchVolley } from './utils/rescueDefense';
import './components/legion.css';
import { BridgeScene } from './components/BridgeScene';
import { BossBattleView } from './components/BossBattleView';
import { SummaryView } from './components/SummaryView';
import { PauseModal } from './components/PauseModal';
import { getMissionProgress, MissionId } from './utils/missions';
import {
  Volume2,
  VolumeX,
  FastForward,
  Pause
} from 'lucide-react';

const STORAGE_KEY = 'math_bridge_squad_progress_v1';

const DEFAULT_PROGRESS: ProgressMap = {
  ADD_20: { highScore: 0, bestTroops: 0, stars: 0, gamesPlayed: 0 },
  ADD_50: { highScore: 0, bestTroops: 0, stars: 0, gamesPlayed: 0 },
  ADD_100: { highScore: 0, bestTroops: 0, stars: 0, gamesPlayed: 0 },
  NUMBER_SENSE: { highScore: 0, bestTroops: 0, stars: 0, gamesPlayed: 0 },
  MULTIPLY_DIGITS: { highScore: 0, bestTroops: 0, stars: 0, gamesPlayed: 0 }
};

export default function App({ onChooseGame }: { onChooseGame: () => void }) {
  const [screen, setScreen] = useState<'SETUP' | 'GAME'>('SETUP');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<QuestionModeId>('ADD_20');
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [autoAdvanceOnSelect, setAutoAdvanceOnSelect] = useState<boolean>(false);

  // Per-question running & choosing duration (configurable: 5s, 8s, 10s, 15s)
  const [questionDuration, setQuestionDuration] = useState<number>(8);

  // Questions & current index (0..19)
  const [questions, setQuestions] = useState<QuestionItem[]>(() =>
    generateQuestionSet('ADD_20', QUESTIONS_PER_LEVEL)
  );
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Squad & HUD state
  const [troops, setTroops] = useState<number>(QUESTION_MODES.ADD_20.initialTroops);
  const [score, setScore] = useState<number>(120);
  const [correctCount, setCorrectCount] = useState<number>(4);
  const [selectedLane, setSelectedLane] = useState<Lane | null>(null);

  const [defense, setDefense] = useState(() => createDefense());
  const [bossHp, setBossHp] = useState(600);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Gate continuous approach progress (0.0 at horizon -> 1.0 when reaching soldiers)
  const gateProgress = useMotionValue(0);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(8);
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
  const [completedMissionIds, setCompletedMissionIds] = useState<MissionId[]>([]);
  const [missionToast, setMissionToast] = useState<string | null>(null);

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
  const missionProgress = getMissionProgress(records);

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
  const startNewGame = useCallback(async (modeId: QuestionModeId) => {
    setLoading(true);
    setLoadError(false);
    try { await prepareBridge(); }
    catch { setLoadError(true); setLoading(false); return; }
    setLoading(false);
    if (impactTimeoutRef.current) {
      window.clearTimeout(impactTimeoutRef.current);
    }
    hasTriggeredImpactRef.current = false;
    const cfg = QUESTION_MODES[modeId];
    const newQuestions = generateQuestionSet(modeId, QUESTIONS_PER_LEVEL);
    setSelectedMode(modeId);
    setQuestions(newQuestions);
    setCurrentIdx(0);
    setTroops(cfg.initialTroops);
    setScore(0);
    setCorrectCount(0);
    setSelectedLane(null);
    setDefense(createDefense(questionDuration));
    setBossHp(cfg.bossMaxHp);
    gateProgress.set(0);
    setQuestionSecondsLeft(questionDuration);
    setIsAdvancing(false);
    setImpactResult(null);
    setFloatingFeedback(null);
    setRecords([]);
    setCompletedMissionIds([]);
    setMissionToast(null);
    setBossVictory(false);
    setGameState('PLAYING');
    setIsPaused(false);
    setScreen('GAME');
    setCountdown(3);
    soundFX.startBackgroundMusic();
  }, [gateProgress, questionDuration]);

  useEffect(() => {
    soundFX.pauseBackgroundMusic(screen !== 'GAME' || isPaused || gameState === 'SUMMARY');
  }, [screen, isPaused, gameState]);

  useEffect(() => {
    const newlyCompleted = getMissionProgress(records).filter(
      (mission) => mission.complete && !completedMissionIds.includes(mission.id)
    );
    if (newlyCompleted.length === 0) return;

    setCompletedMissionIds((previous) => [
      ...previous,
      ...newlyCompleted.map((mission) => mission.id).filter((id) => !previous.includes(id))
    ]);
    setMissionToast(`任務完成：${newlyCompleted.map((mission) => mission.title).join('、')}！`);
  }, [records, completedMissionIds]);

  useEffect(() => {
    if (!missionToast) return;
    const timeout = window.setTimeout(() => setMissionToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [missionToast]);

  // Resolve impact when gateProgress reaches 1.0 (soldiers smash through the gate!)
  const resolveGateImpact = useCallback(() => {
    if (hasTriggeredImpactRef.current) return;
    hasTriggeredImpactRef.current = true;

    const submitted = isAdvancing && selectedLane !== null;
    const chosenAnswer = submitted ? (selectedLane === 'LEFT' ? currentQuestion.leftOption : currentQuestion.rightOption) : null;
    const isCorrect = submitted && selectedLane === currentQuestion.correctLane;

    setImpactResult(isCorrect ? 'CORRECT' : 'WRONG');

    if (isCorrect) {
      launchVolley(defense, selectedLane === 'LEFT' ? -1 : 1, Math.min(troops, 64));
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
      addReinforcements(defense);
      soundFX.playWrongGate();
      const lostTroops = currentQuestion.penaltyTroops;
      setTroops((t) => Math.max(1, t - lostTroops));
      setCorrectCount((c) => Math.max(0, c - 1));
      setFloatingFeedback({
        text: `${submitted ? "再試一次" : "時間到"} · －${Math.min(troops - 1, lostTroops)} 士兵`,
        subtext: `正確答案是 ${currentQuestion.correctAnswer}`,
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
          : -Math.min(troops - 1, currentQuestion.penaltyTroops)
      }
    ]);

  }, [selectedLane, currentQuestion, correctCount, defense, troops, isAdvancing]);

  // Feedback is held while paused; leaving the game cancels pending transitions.
  useEffect(() => {
    if (!impactResult || isPaused || screen !== 'GAME') return;
    impactTimeoutRef.current = window.setTimeout(() => {
      setIsAdvancing(false);
      setImpactResult(null);
      setFloatingFeedback(null);
      if (currentIdx + 1 >= questions.length) setGameState('BOSS_FIGHT');
      else {
        hasTriggeredImpactRef.current = false;
        setSelectedLane(null);
        gateProgress.set(0);
        setQuestionSecondsLeft(questionDuration);
        setCurrentIdx((idx) => idx + 1);
      }
    }, impactResult === 'CORRECT' ? 540 : 1050);
    return () => window.clearTimeout(impactTimeoutRef.current!);
  }, [impactResult, isPaused, screen, currentIdx, questions.length, gateProgress, questionDuration]);

  useEffect(() => {
    if (countdown === null || isPaused || screen !== 'GAME') return;
    const timer = window.setTimeout(() => setCountdown(countdown === 1 ? null : countdown - 1), 900);
    return () => window.clearTimeout(timer);
  }, [countdown, isPaused, screen]);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden && screen === 'GAME' && gameState !== 'SUMMARY') setIsPaused(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [screen, gameState]);

  // Animate motion values each frame; only update the React countdown ten times a second.
  useEffect(() => {
    if (screen !== 'GAME' || countdown !== null || gameState !== 'PLAYING' || isPaused || impactResult) return;
    let lastTime = performance.now();
    let lastHudTime = 0;
    let animId: number;
    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const next = Math.min(1, gateProgress.get() + dt * (isAdvancing ? 2.4 : 1 / questionDuration));
      gateProgress.set(next);
      if (now - lastHudTime >= 100 || next === 1) {
        setQuestionSecondsLeft((1 - next) * questionDuration);
        lastHudTime = now;
      }
      if (next === 1) { resolveGateImpact(); return; }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [screen, countdown, gameState, isPaused, impactResult, isAdvancing, questionDuration, gateProgress, resolveGateImpact]);

  // Clicking "前進" turbo-sprints the squad through the gate immediately
  const handleAdvance = useCallback(() => {
    if (screen !== 'GAME' || countdown !== null || gameState !== 'PLAYING' || isPaused || isAdvancing || !selectedLane || impactResult) return;
    soundFX.playAdvanceCharge();
    setIsAdvancing(true);
  }, [screen, countdown, gameState, isPaused, isAdvancing, selectedLane, impactResult]);

  // Selecting Left or Right lane
  const handleSelectLane = useCallback(
    (lane: Lane) => {
      if (screen !== 'GAME' || countdown !== null || gameState !== 'PLAYING' || isPaused || isAdvancing || impactResult) return;
      soundFX.playLaneSelect();
      setSelectedLane(lane);
      if (autoAdvanceOnSelect) {
        setIsAdvancing(true);
      }
    },
    [screen, countdown, gameState, isPaused, impactResult, isAdvancing, autoAdvanceOnSelect]
  );

  // Keyboard navigation (Left/Right arrows to select lane, Space/Enter to turbo-sprint)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || screen !== 'GAME' || countdown !== null || gameState !== 'PLAYING' || isPaused || impactResult) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleSelectLane('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleSelectLane('RIGHT');
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
        if (e.target instanceof HTMLButtonElement && !e.target.closest('.legion-controls')) return;
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, countdown, gameState, isPaused, impactResult, handleSelectLane, handleAdvance]);

  const handleToggleMute = () => {
    const nextMuted = !muted;
    soundFX.setMuted(nextMuted);
    setMuted(nextMuted);
  };

  const handleBossBattleComplete = useCallback(
    (victory: boolean, bossBonusScore: number) => {
      const finalScore = score + bossBonusScore + 150;
      setScore(finalScore);
      setBossVictory(victory);
      if (victory && !completedMissionIds.includes('boss')) {
        setCompletedMissionIds((previous) => previous.includes('boss') ? previous : [...previous, 'boss']);
        setMissionToast('任務完成：首領剋星！');
      }
      const totalCorrect = records.filter((r) => r.isCorrect).length;
      const earnedStars =
        totalCorrect >= 18 && victory
          ? 3
          : totalCorrect >= 12
          ? 2
          : totalCorrect >= 6
          ? 1
          : 0;
      updateModeProgress(selectedMode, finalScore, troops, earnedStars);
      setGameState('SUMMARY');
    },
    [score, records, updateModeProgress, selectedMode, troops, completedMissionIds]
  );

  const timeProgressPercent = Math.max(
    0,
    Math.min(100, (questionSecondsLeft / questionDuration) * 100)
  );

  const returnToSettings = () => {
    soundFX.stopBackgroundMusic();
    setScreen('SETUP');
    setIsPaused(false);
    setCountdown(null);
    setImpactResult(null);
  };

  if (screen === 'SETUP') return <><SettingsScreen starting={loading}
    onChooseGame={onChooseGame}
    selectedMode={selectedMode} onSelectMode={setSelectedMode}
    questionDuration={questionDuration} onDurationChange={setQuestionDuration}
    muted={muted} onToggleMute={handleToggleMute}
    autoAdvance={autoAdvanceOnSelect} onToggleAutoAdvance={() => setAutoAdvanceOnSelect(v => !v)}
    progress={progress} onStart={() => startNewGame(selectedMode)} />{loadError && <p role="alert">場景載入失敗，請再按「開始遊戲」。</p>}</>;

  return (
    <div className="game-shell min-h-svh w-full text-white flex flex-col items-center justify-center p-2 sm:p-4 gap-3">
      <nav className="w-full max-w-[480px] flex justify-between items-center gap-2">
        <button onClick={returnToSettings} className="rounded-xl px-3.5 py-2 bg-slate-800/90 border border-white/20 text-sm font-bold hover:bg-slate-700 cursor-pointer">← 返回設定</button>
        <div className="text-center leading-tight">
          <div className="font-black text-sm text-white">橋樑算術衝鋒</div>
          <div className="text-xs text-slate-300">{currentModeConfig.shortTitle} · {questionDuration} 秒／題</div>
        </div>
        <button onClick={handleToggleMute} aria-label="切換音效" className="p-2.5 rounded-xl bg-slate-800/90 border border-white/15 hover:bg-slate-700 cursor-pointer">{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
      </nav>
      <main className="legion-board">
        {gameState !== 'SUMMARY' && <>
          <header className="legion-hud">
            <span>士兵 <b>{troops}</b></span><span>得分 <b>{score}</b></span>
            <span className="legion-weapon">{currentWeapon.name}</span>
            <button onClick={() => setIsPaused(true)} aria-label="暫停遊戲"><Pause size={17} /></button>
          </header>
          {gameState === 'PLAYING' ? <section className="legion-question" aria-label="數學題目">
            <div className="legion-meta"><span>第 {currentQuestion.index}／{questions.length} 題 · {currentModeConfig.shortTitle}</span><span>{questionSecondsLeft.toFixed(1)} 秒</span></div>
            <h2 aria-live="polite">{currentQuestion.prompt}</h2>
            <progress aria-label="本題剩餘時間" max={100} value={timeProgressPercent} />
          </section> : <BossBattleView modeConfig={currentModeConfig} troops={troops} weapon={currentWeapon}
            hp={bossHp} armed={records.some(r => r.isCorrect)} paused={isPaused} onHp={setBossHp} onFinishBattle={handleBossBattleComplete} />}
          <div className="legion-stage">
            <BridgeScene paused={isPaused || countdown !== null} mode={selectedMode} question={currentQuestion}
              troops={troops} selectedLane={selectedLane} gateProgress={gateProgress} isAdvancing={isAdvancing}
              impact={!!impactResult} weapon={currentWeapon} defense={defense} boss={gameState === 'BOSS_FIGHT'}
              bossHp={bossHp} armed={records.some(r => r.isCorrect)} onSelectLane={handleSelectLane} />
            {floatingFeedback && <p className={'legion-feedback ' + (floatingFeedback.isPositive ? 'good' : 'review')} role="status">
              {floatingFeedback.text} · {floatingFeedback.subtext}
            </p>}
            {missionToast && <p className="legion-mission-toast" role="status">{missionToast}</p>}
          </div>
          {gameState === 'PLAYING' ? <div className="legion-controls">
            <div className="legion-missions" aria-label="本關任務進度">{missionProgress.map(m => <span key={m.id} className={m.complete ? 'done' : ''} title={m.description}>
              {m.complete ? '✓ ' : ''}{m.title} {m.id === 'boss' && !m.complete ? '待完成' : `${m.value}/${m.target}`}
            </span>)}</div>
            <div className="legion-lanes">{(['LEFT','RIGHT'] as const).map(lane => {
              const label = lane === 'LEFT' ? '左' : '右';
              const badge = lane === 'LEFT' ? '← 左道' : '右道 →';
              const value = lane === 'LEFT' ? currentQuestion.leftOption : currentQuestion.rightOption;
              return <button key={lane} type="button" aria-label={`${label}邊跑道 ${value}`} aria-pressed={selectedLane === lane}
                disabled={isPaused || countdown !== null || isAdvancing || !!impactResult} onClick={() => handleSelectLane(lane)}>
                {lane === 'LEFT' ? <><small>{badge}</small> <span>{value}</span></> : <><span>{value}</span> <small>{badge}</small></>}
              </button>;
            })}</div>
            <button className="legion-advance" type="button" disabled={!selectedLane || isAdvancing || !!impactResult || isPaused || countdown !== null} onClick={handleAdvance}>
              前進 <FastForward size={17} />
            </button>
          </div> : <div className="legion-result-line">衝線兵力 {troops} · {currentWeapon.name} · {records.some(r => r.isCorrect) ? '軍團合力迎戰' : '能量不足'}</div>}
        </>}

        {/* SUMMARY & QUESTION REVIEW VIEW */}
        {gameState === 'SUMMARY' && (
          <SummaryView
            modeConfig={currentModeConfig}
            score={score}
            troops={troops}
            weapon={currentWeapon}
            records={records}
            victory={bossVictory}
            missionProgress={getMissionProgress(records, bossVictory)}
            onPlayAgain={() => startNewGame(selectedMode)}
            onSwitchMode={(mId) => { setSelectedMode(mId); returnToSettings(); }}
            onReturnSettings={returnToSettings}
          />
        )}

        {/* PAUSE & MODE SWITCH MODAL */}
        {isPaused && (
          <PauseModal onResume={() => setIsPaused(false)} onRestart={() => startNewGame(selectedMode)} onSettings={returnToSettings} />
        )}
        {countdown !== null && gameState === 'PLAYING' && !isPaused && (
          <div className="absolute inset-0 z-40 bg-slate-950/65 flex flex-col items-center justify-center gap-5 backdrop-blur-sm" aria-live="polite">
            <p className="text-xl font-black">準備出發！</p>
            <span key={countdown} className="countdown-pop text-8xl font-black text-amber-300">{countdown}</span>
            <p className="text-sm text-slate-200">選擇正確跑道，再按「前進」</p>
          </div>
        )}
      </main>
    </div>
  );
}
