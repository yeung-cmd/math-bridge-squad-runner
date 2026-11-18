import { useEffect, useRef } from 'react';
import type { QuestionModeConfig, WeaponInfo } from '../types/game';
import { soundFX } from '../utils/sound';

interface Props {
  modeConfig: QuestionModeConfig;
  troops: number;
  weapon: WeaponInfo;
  hp: number;
  armed: boolean;
  paused: boolean;
  onHp: (value: number) => void;
  onFinishBattle: (victory: boolean, bonus: number) => void;
}

export function BossBattleView({ modeConfig, troops, weapon, hp, armed, paused, onHp, onFinishBattle }: Props) {
  const firepower = armed ? Math.round(troops * 35 * weapon.multiplier) : 0;
  const clock = useRef({ elapsed: 0, bursts: 0, settled: -1, victory: false, bonus: 0 });
  useEffect(() => {
    if (paused) return;
    const state = clock.current;
    let last = performance.now();
    let handle = 0;
    const tick = (now: number) => {
      state.elapsed += document.hidden ? 0 : Math.min(80, now - last);
      last = now;
      const bursts = Math.min(17, Math.max(0, Math.floor((state.elapsed - 800) / 130)));
      if (state.settled < 0) {
        const burstDamage = Math.min(Math.ceil(modeConfig.bossMaxHp / 12), Math.max(25, Math.ceil(firepower / 14)));
        const damage = armed ? burstDamage * bursts : 0;
        const remaining = Math.max(0, modeConfig.bossMaxHp - damage);
        if (bursts > state.bursts) {
          state.bursts = bursts;
          if (armed) soundFX.playShotgunBurst();
          onHp(remaining);
        }
        if (remaining === 0 || state.elapsed >= 3100) {
          state.settled = state.elapsed;
          state.victory = remaining === 0 || firepower >= modeConfig.bossMaxHp * .6;
          state.bonus = Math.round(firepower * (remaining === 0 ? .5 : .4));
          if (state.victory) soundFX.playVictoryFanfare();
        }
      } else if (state.elapsed - state.settled >= 900) {
        onFinishBattle(state.victory, state.bonus);
        return;
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [armed, firepower, modeConfig, paused, onHp, onFinishBattle]);
  return <div className="legion-question">
    <div className="legion-meta"><span>終點守關</span><span>耐力 {hp}／{modeConfig.bossMaxHp}</span></div>
    <h2>{modeConfig.bossName}</h2>
    <progress aria-label="首領耐力" max={modeConfig.bossMaxHp} value={hp} />
  </div>;
}
