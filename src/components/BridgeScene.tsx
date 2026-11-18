import { useEffect, useLayoutEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';
import type { Lane, QuestionItem, QuestionModeId, WeaponInfo } from '../types/game';
import { updateDefense, type Defense } from '../utils/rescueDefense';
import { drawBridge } from '../utils/bridgeField';

interface Props {
  question: QuestionItem;
  mode: QuestionModeId;
  troops: number;
  selectedLane: Lane | null;
  paused: boolean;
  gateProgress: MotionValue<number>;
  isAdvancing: boolean;
  impact: boolean;
  weapon: WeaponInfo;
  defense: Defense;
  boss: boolean;
  bossHp: number;
  armed: boolean;
  onSelectLane: (lane: Lane) => void;
}

export function BridgeScene(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  useLayoutEffect(() => { latest.current = props; });

  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext('2d', { alpha: false });
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let time = 0, travel = 0, lane = 0, destination = 0, bossTime = -1;
    let last = 0, handle = 0;
    let previousCount = latest.current.troops, firstRecruit = previousCount, joinedAt = -10;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      el.width = Math.max(1, Math.round(el.clientWidth * dpr));
      el.height = Math.max(1, Math.round(el.clientHeight * dpr));
      ctx.setTransform(el.width / 400, 0, 0, el.height / 420, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    const paint = (now: number) => {
      const p = latest.current;
      const dt = p.paused || !last || document.hidden ? 0 : Math.min(80, now - last);
      last = now;
      time += dt / 1000;
      travel += dt * (p.isAdvancing ? .004 : .0013);
      if (p.selectedLane) destination = p.selectedLane === 'LEFT' ? -1 : 1;
      if (p.boss) {
        destination = 0;
        bossTime = Math.max(0, bossTime) + dt / 1000;
      }
      lane += (destination - lane) * (reduced.matches ? 1 : 1 - Math.exp(-dt / 80));
      if (dt && (!p.boss || bossTime < 1)) updateDefense(p.defense, dt, !p.boss);
      if (p.troops > previousCount) {
        firstRecruit = previousCount;
        joinedAt = time;
      }
      previousCount = p.troops;
      drawBridge(ctx, { ...p, time, travel, lane, firstRecruit, recruitAge: time - joinedAt, selected: p.selectedLane, gate: p.gateProgress.get(),
        bossTime, reduced: reduced.matches });
      handle = requestAnimationFrame(paint);
    };
    handle = requestAnimationFrame(paint);
    return () => { observer.disconnect(); cancelAnimationFrame(handle); };
  }, [props.defense]);

  return <canvas ref={canvas} className="legion-field" aria-hidden="true" onClick={e => {
    const bounds = e.currentTarget.getBoundingClientRect();
    props.onSelectLane(e.clientX < bounds.left + bounds.width / 2 ? 'LEFT' : 'RIGHT');
  }} />;
}
