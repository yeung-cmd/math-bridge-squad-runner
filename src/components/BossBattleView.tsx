import React, { useEffect, useState } from 'react';
import { QuestionModeConfig, WeaponInfo } from '../types/game';
import { soundFX } from '../utils/sound';
import { Shield, Sparkles, Flame } from 'lucide-react';

interface BossBattleViewProps {
  modeConfig: QuestionModeConfig;
  troops: number;
  weapon: WeaponInfo;
  onFinishBattle: (victory: boolean, bossBonusScore: number) => void;
}

export const BossBattleView: React.FC<BossBattleViewProps> = ({
  modeConfig,
  troops,
  weapon,
  onFinishBattle
}) => {
  const totalFirepower = Math.round(troops * 35 * weapon.multiplier);
  const [bossHp, setBossHp] = useState(modeConfig.bossMaxHp);
  const [isFiring, setIsFiring] = useState(false);
  const [battleDone, setBattleDone] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsFiring(true);
    }, 350);
    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!isFiring || battleDone) return;

    const stepDamage = Math.max(25, Math.ceil(totalFirepower / 14));
    const interval = setInterval(() => {
      soundFX.playShotgunBurst();
      setBossHp((prev) => {
        const next = Math.max(0, prev - stepDamage);
        if (next === 0) {
          clearInterval(interval);
          setBattleDone(true);
          soundFX.playVictoryFanfare();
          setTimeout(() => {
            onFinishBattle(true, Math.round(totalFirepower * 0.5));
          }, 900);
        }
        return next;
      });
    }, 130);

    const maxDurationTimer = setTimeout(() => {
      clearInterval(interval);
      if (!battleDone) {
        setBattleDone(true);
        const victory = totalFirepower >= modeConfig.bossMaxHp * 0.6;
        if (victory) soundFX.playVictoryFanfare();
        onFinishBattle(victory, Math.round(totalFirepower * 0.4));
      }
    }, 2300);

    return () => {
      clearInterval(interval);
      clearTimeout(maxDurationTimer);
    };
  }, [isFiring, battleDone, totalFirepower, modeConfig.bossMaxHp, onFinishBattle]);

  const hpPercent = Math.max(0, Math.min(100, Math.round((bossHp / modeConfig.bossMaxHp) * 100)));

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-[#1E3A5F] to-[#38A7F8] flex flex-col items-center justify-between p-5 text-white overflow-hidden">
      {/* Top Boss Header */}
      <div className="w-full bg-[#182235]/95 border-[3px] border-white rounded-2xl p-3.5 shadow-xl z-10">
        <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
          <span className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-rose-500" />
            終點守關 BOSS 對決
          </span>
          <span className="tabular-nums font-display">
            HP {bossHp} / {modeConfig.bossMaxHp}
          </span>
        </div>
        <h3 className="text-lg font-black tracking-wide mb-2">
          {modeConfig.bossName}
        </h3>
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-white/30">
          <div
            style={{ width: `${hpPercent}%` }}
            className="h-full bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 transition-all duration-150"
          />
        </div>
      </div>

      {/* Boss Character & Projectile Barrage */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center">
        {/* Giant Boss Figure */}
        <div
          className={`relative w-32 h-32 rounded-3xl bg-gradient-to-b from-rose-600 to-rose-900 border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center transition-transform ${
            isFiring && bossHp > 0 ? 'scale-95 animate-pulse' : ''
          } ${bossHp === 0 ? 'scale-75 opacity-30 rotate-12' : ''}`}
        >
          <div className="flex gap-4 mb-2">
            <div className="w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-rose-950" />
            </div>
            <div className="w-5 h-5 rounded-full bg-amber-300 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-rose-950" />
            </div>
          </div>
          <div className="w-14 h-4 bg-rose-950 rounded-md border border-amber-200/40" />
          <span className="mt-2 text-xs font-black text-amber-200">
            {bossHp === 0 ? '已擊破！' : '守關巨獸'}
          </span>
        </div>

        {/* Animated Shotgun / Laser Barrage */}
        {isFiring && bossHp > 0 && (
          <div className="my-4 flex gap-3 items-center justify-center">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                style={{ backgroundColor: weapon.projectileColor }}
                className="w-2.5 h-8 rounded-full animate-ping shadow-lg"
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Squad Firepower Panel */}
      <div className="w-full bg-[#182235]/95 border-[3px] border-white rounded-2xl p-4 shadow-xl z-10 text-center">
        <div className="flex items-center justify-around mb-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-slate-300">衝線士兵：</span>
            <span className="font-display font-black text-xl text-amber-400 tabular-nums">
              {troops}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-bold text-white">{weapon.name}</span>
            <span className="text-xs font-bold text-amber-300">
              (x{weapon.multiplier})
            </span>
          </div>
        </div>
        <div className="text-sm font-black text-emerald-400">
          軍團總火力輸出：{totalFirepower} 點傷害！
        </div>
      </div>
    </div>
  );
};
