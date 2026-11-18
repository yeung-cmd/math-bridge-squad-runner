import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BatteryCharging, Bot, CheckCircle2, CircleX, FastForward, Pause, RadioTower, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { SettingsScreen } from './SettingsScreen';
import { PauseModal } from './PauseModal';
import { QuestionItem, QuestionModeId } from '../types/game';
import { generateQuestionSet, QUESTION_MODES } from '../utils/questionGenerator';
import { soundFX } from '../utils/sound';
import { createRescuePainter, REWARD_TILES, SCENE_HEIGHT, SCENE_WIDTH, STARTING_ROBOTS } from '../utils/rescueScene';
import './rescue.css';

const QUESTION_COUNT = 10;
const READY_MS = 3000;
const RUSH_MS = 240;
const CORRECT_MS = 870;
const REVIEW_MS = 1100;
const TOWER_MS = 1700;

type Lane = -1 | 0 | 1;
type Result = 'correct' | 'wrong' | 'timeout';
type Phase = 'ready' | 'question' | 'rush' | 'reward' | 'tower' | 'summary';

interface Answer {
  question: QuestionItem;
  chosen: number | null;
  result: Result;
}

interface RunState {
  phase: Phase;
  phaseMs: number;
  elapsed: number;
  distance: number;
  index: number;
  lane: number;
  selected: Lane;
  approach: number;
  rushFrom: number;
  energy: number;
  correct: number;
  collected: number;
  records: Answer[];
}

function makeRun(): RunState {
  return { phase: 'ready', phaseMs: 0, elapsed: 0, distance: 0, index: 0, lane: 0, selected: 0, approach: 0, rushFrom: 0, energy: 0, correct: 0, collected: 0, records: [] };
}

export default function RescueGame({ onChooseGame }: { onChooseGame: () => void }) {
  const [mode, setMode] = useState<QuestionModeId>('ADD_20');
  const [seconds, setSeconds] = useState(8);
  const [muted, setMuted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [mission, setMission] = useState<{ id: number; questions: QuestionItem[] } | null>(null);

  const toggleMute = () => {
    soundFX.setMuted(!muted);
    setMuted(!muted);
  };

  const start = () => {
    soundFX.setMuted(muted);
    soundFX.playLaneSelect();
    setMission({ id: (mission?.id ?? 0) + 1, questions: generateQuestionSet(mode, QUESTION_COUNT) });
  };

  if (!mission) {
    return (
      <SettingsScreen game="rescue" onChooseGame={onChooseGame} selectedMode={mode} onSelectMode={setMode}
        questionDuration={seconds} onDurationChange={setSeconds} muted={muted} onToggleMute={toggleMute}
        autoAdvance={autoAdvance} onToggleAutoAdvance={() => setAutoAdvance(value => !value)} onStart={start} />
    );
  }

  return (
    <RescueRun key={mission.id} questions={mission.questions} seconds={seconds} mode={mode} autoAdvance={autoAdvance}
      muted={muted} onToggleMute={toggleMute} onSettings={() => setMission(null)} onRestart={start} />
  );
}

interface RunProps {
  questions: QuestionItem[];
  seconds: number;
  mode: QuestionModeId;
  autoAdvance: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onSettings: () => void;
  onRestart: () => void;
}

function RescueRun({ questions, seconds, mode, autoAdvance, muted, onToggleMute, onSettings, onRestart }: RunProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const painter = useRef<ReturnType<typeof createRescuePainter> | null>(null);
  const run = useRef(makeRun());
  const pausedRef = useRef(false);
  const swipe = useRef<{ pointer: number; start: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState(() => ({ ...run.current }));
  const updateView = () => setView({ ...run.current });
  const limit = seconds * 1000;
  const question = questions[view.index];
  const latest = view.phase === 'reward' ? view.records.at(-1) : undefined;
  const layers = Math.ceil(view.correct / 2);

  function pause(next: boolean) {
    if (run.current.phase === 'summary') return;
    pausedRef.current = next;
    setPaused(next);
  }

  function advance() {
    const state = run.current;
    if (pausedRef.current || state.phase !== 'question' || state.selected === 0) return;
    state.phase = 'rush';
    state.phaseMs = 0;
    state.rushFrom = state.approach;
    soundFX.playAdvanceCharge();
    updateView();
  }

  function select(lane: Lane) {
    const state = run.current;
    if (pausedRef.current || state.phase !== 'question') return;
    if (state.selected !== lane) soundFX.playLaneSelect();
    state.selected = lane;
    if (autoAdvance) advance();
    else updateView();
  }

  useEffect(() => heading.current?.focus(), []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) pause(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape' && run.current.phase !== 'summary') {
        event.preventDefault();
        pause(!pausedRef.current);
        return;
      }
      if (pausedRef.current || run.current.phase !== 'question') return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        select(event.key === 'ArrowLeft' ? -1 : 1);
      } else if ((event.key === ' ' || event.key === 'Enter') && (!(event.target instanceof HTMLButtonElement) || event.target.hasAttribute('data-rescue-lane'))) {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [autoAdvance]);

  useEffect(() => {
    if (!canvas.current) return;
    const target = canvas.current;
    const ctx = target.getContext('2d', { alpha: false });
    if (!ctx) return;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(target.clientWidth * dpr));
      const height = Math.max(1, Math.round(target.clientHeight * dpr));
      if (target.width === width && target.height === height && painter.current) return;
      target.width = width;
      target.height = height;
      ctx.scale(width / SCENE_WIDTH, height / SCENE_HEIGHT);
    };
    painter.current = createRescuePainter(ctx);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const state = run.current;
    let lastTime: number | null = null;
    let lastUpdate = 0;
    let handle: number;

    const enter = (phase: Phase) => {
      state.phase = phase;
      state.phaseMs = 0;
    };

    const finishQuestion = () => {
      const item = questions[state.index];
      const chosen = state.selected === -1 ? item.leftOption : state.selected === 1 ? item.rightOption : null;
      const result = chosen === null ? 'timeout' : chosen === item.correctAnswer ? 'correct' : 'wrong';
      state.records = [...state.records, { question: item, chosen, result }];
      state.collected = 0;
      if (result === 'wrong') soundFX.playWrongGate();
      enter('reward');
    };

    const tick = (time: number) => {
      if (pausedRef.current || document.hidden) return;
      const dt = lastTime === null ? 0 : time - lastTime;
      lastTime = time;
      const previousPhase = state.phase;
      const previousEnergy = state.energy;
      const previousPhaseMs = state.phaseMs;
      // Simulation time and movement are independent of the display refresh rate.
      state.phaseMs += dt;
      const visualDt = Math.min(dt, 50);
      state.elapsed += visualDt / 1000;
      state.distance += visualDt * (state.phase === 'rush' || state.phase === 'reward' ? .0055 : .0018);
      state.lane = reducedMotion.matches ? state.selected : state.lane + (state.selected - state.lane) * (1 - Math.exp(-visualDt / 48));

      const record = state.records.at(-1);
      if (state.phase === 'ready' && state.phaseMs >= READY_MS) {
        enter('question');
      } else if (state.phase === 'question') {
        state.approach = Math.min(1, state.phaseMs / limit);
        if (state.phaseMs >= limit) finishQuestion();
      } else if (state.phase === 'rush') {
        state.approach = state.rushFrom + (1 - state.rushFrom) * Math.min(1, state.phaseMs / RUSH_MS);
        if (state.phaseMs >= RUSH_MS) finishQuestion();
      } else if (state.phase === 'reward' && record) {
        if (record.result === 'correct') {
          const collected = Math.max(0, Math.min(REWARD_TILES, 1 + Math.floor((state.phaseMs - 130) / 145)));
          if (collected > state.collected) {
            state.energy += collected - state.collected;
            state.collected = collected;
            soundFX.playLaneSelect();
          }
          if (previousPhaseMs < 570 && state.phaseMs >= 570) {
            state.correct += 1;
            soundFX.playCorrectGate();
            updateView();
          }
        }

        if (state.phaseMs >= (record.result === 'correct' ? CORRECT_MS : REVIEW_MS)) {
          if (state.index + 1 === questions.length) {
            if (state.correct > 0) soundFX.playVictoryFanfare();
            enter('tower');
          } else {
            state.index += 1;
            state.approach = 0;
            state.selected = 0;
            enter('question');
          }
        }
      } else if (state.phase === 'tower' && state.phaseMs >= TOWER_MS) {
        enter('summary');
      }

      const item = questions[state.index];
      painter.current?.({
        elapsed: state.elapsed, distance: state.distance, lane: state.lane, selected: state.selected,
        approach: state.approach, rush: state.phase === 'rush',
        team: STARTING_ROBOTS + state.correct, options: [item.leftOption, item.rightOption],
        result: state.phase === 'reward' ? state.records.at(-1)?.result ?? null : null,
        rewardElapsed: state.phaseMs,
        charge: state.phase === 'tower' ? state.phaseMs / TOWER_MS : null,
        layers: Math.ceil(state.correct / 2)
      }, reducedMotion.matches);

      if (previousPhase !== state.phase || previousEnergy !== state.energy || time - lastUpdate >= 100) {
        lastUpdate = time;
        updateView();
      }
      if (state.phase !== 'summary') handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [paused, limit, questions]);

  const canAnswer = view.phase === 'question' && !paused;
  const inQuestion = view.phase !== 'tower' && view.phase !== 'summary';
  const remaining = view.phase === 'ready' ? seconds : view.phase === 'question' ? Math.max(0, (limit - view.phaseMs) / 1000) : 0;

  return (
    <div className="rescue-shell min-h-svh text-white flex flex-col items-center justify-center px-2 py-2 sm:px-5 sm:py-4">
      <nav aria-label="遊戲操作" className="rescue-nav">
        <button type="button" onClick={onSettings}><ArrowLeft size={18} /> 返回設定</button>
        <h1 ref={heading} tabIndex={-1} className="font-black text-sm outline-none">數學星光救援隊</h1>
        <button type="button" onClick={onToggleMute} aria-label={muted ? '開啟音效' : '關閉音效'}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
      </nav>

      {view.phase === 'summary' ? (
        <RescueSummary view={view} onSettings={onSettings} onRestart={onRestart} />
      ) : (
        <main className="rescue-board">
          <div className="rescue-hud">
            <span><BatteryCharging size={20} aria-hidden="true" /> 能量 <strong>{view.energy}</strong></span>
            <span><Bot size={20} aria-hidden="true" /> 隊員 <strong>{STARTING_ROBOTS + view.correct}</strong></span>
            <button type="button" onClick={() => pause(true)} aria-label="暫停遊戲" className="rescue-icon"><Pause size={19} /></button>
          </div>

          {inQuestion ? (
            <section className="rescue-question" aria-label="數學題目">
              <div className="rescue-question-meta">
                <span>第 {view.index + 1}／{questions.length} 題 · {QUESTION_MODES[mode].shortTitle}</span>
                <span className={remaining <= 2 && canAnswer ? 'text-amber-300' : 'text-teal-200'}>{remaining.toFixed(1)} 秒</span>
              </div>
              <p className="rescue-prompt" aria-live="polite">{question.prompt}</p>
              <div className="rescue-timer" aria-hidden="true"><div style={{ transform: `scaleX(${remaining / seconds})` }} /></div>
            </section>
          ) : (
            <section className="rescue-question text-center" aria-live="polite">
              <h2 className="font-black text-xl">為燈塔充能</h2>
              <p className="mt-1 text-sm text-teal-200">{layers > 0 ? `準備點亮 ${layers} 層燈塔` : '本關沒有收集到能量'}</p>
            </section>
          )}

          <div className="rescue-scene"
            onPointerDown={event => {
              if (!canAnswer || event.pointerType === 'mouse') return;
              swipe.current = { pointer: event.pointerId, start: event.clientX };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={event => {
              if (swipe.current?.pointer !== event.pointerId) return;
              const change = event.clientX - swipe.current.start;
              if (Math.abs(change) < 30) return;
              swipe.current = null;
              select(change < 0 ? -1 : 1);
            }}
            onPointerUp={() => { swipe.current = null; }}
            onPointerCancel={() => { swipe.current = null; }}
          >
            <canvas ref={canvas} aria-hidden="true" />
            {view.phase === 'ready' && (
              <div className="rescue-ready" role="status">
                <span>準備出發</span><strong>{Math.max(1, Math.ceil((READY_MS - view.phaseMs) / 1000))}</strong>
              </div>
            )}
            {latest && (
              <div className={`rescue-feedback ${latest.result === 'correct' ? 'rescue-feedback-good' : 'rescue-feedback-review'}`} role="status">
                {latest.result === 'correct' ? (
                  <><CheckCircle2 size={22} /> <span>答對了！{view.collected > 0 && `＋${view.collected} 能量`}{view.phaseMs >= 570 && ' · ＋1 隊員'}</span></>
                ) : (
                  <><CircleX size={22} /> <span>{latest.result === 'timeout' ? '時間到' : '再接再厲'} · 正確答案是 {latest.question.correctAnswer}</span></>
                )}
              </div>
            )}
          </div>

          {inQuestion && (
            <div className="rescue-controls">
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" data-rescue-lane aria-label={`左邊跑道 ${question.leftOption}`} aria-pressed={view.selected === -1} disabled={!canAnswer} onClick={() => select(-1)}><small>←</small> {question.leftOption}</button>
                <button type="button" data-rescue-lane aria-label={`右邊跑道 ${question.rightOption}`} aria-pressed={view.selected === 1} disabled={!canAnswer} onClick={() => select(1)}>{question.rightOption} <small>→</small></button>
              </div>
              <button type="button" className="rescue-advance" onClick={advance} disabled={!canAnswer || view.selected === 0}>前進 <FastForward size={18} aria-hidden="true" /></button>
            </div>
          )}

          {paused && <PauseModal onResume={() => pause(false)} onRestart={onRestart} onSettings={onSettings} />}
        </main>
      )}
    </div>
  );
}

function RescueSummary({ view, onSettings, onRestart }: { view: RunState; onSettings: () => void; onRestart: () => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  return (
    <main className="rescue-summary page-enter">
      <header>
        <RadioTower className="mx-auto text-teal-200" size={36} aria-hidden="true" />
        <h2 ref={title} tabIndex={-1} className="font-black text-2xl mt-2 outline-none">任務完成</h2>
        <p className="mt-2 text-sm text-slate-200">點亮 {Math.ceil(view.correct / 2)}／5 層燈塔</p>
      </header>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div><dt>答對</dt><dd>{view.correct}／{view.records.length}</dd></div>
        <div><dt>能量</dt><dd>{view.energy}</dd></div>
        <div><dt>隊員</dt><dd>{STARTING_ROBOTS + view.correct}</dd></div>
      </dl>

      <section aria-labelledby="rescue-review">
        <h3 id="rescue-review" className="font-black mb-2">答案回顧</h3>
        <ol className="rescue-review">
          {view.records.map(({ question, result, chosen }) => (
            <li key={question.id}>
              <strong className="text-sm">{question.index}. {question.prompt}</strong>
              <span className={result === 'correct' ? 'text-teal-200' : 'text-amber-200'}>
                {result === 'correct' ? '答對' : chosen === null ? '未作答' : `作答：${chosen}`} · 答案：{question.correctAnswer}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onSettings}><ArrowLeft size={18} /> 返回設定</button>
        <button type="button" onClick={onRestart} className="rescue-restart"><RotateCcw size={18} /> 再玩一次</button>
      </div>
    </main>
  );
}
