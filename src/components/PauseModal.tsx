import React from 'react';
import { Play, RotateCcw, Settings } from 'lucide-react';
interface Props { onResume: () => void; onRestart: () => void; onSettings: () => void; }
export function PauseModal({ onResume, onRestart, onSettings }: Props) {
  return <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-labelledby="pause-title">
    <div className="page-enter setup-card p-7 w-full max-w-sm text-center">
      <h2 id="pause-title" className="text-2xl font-black">休息一下</h2>
      <p className="text-slate-300 text-sm mt-2 mb-6">遊戲已暫停，準備好便繼續。</p>
      <button autoFocus onClick={onResume} className="w-full bg-amber-300 text-slate-950 p-4 rounded-xl font-black flex items-center justify-center gap-2 cursor-pointer"><Play size={18} /> 繼續遊戲</button>
      <button onClick={onRestart} className="w-full bg-slate-700 p-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-3 cursor-pointer"><RotateCcw size={18} /> 重新開始</button>
      <button onClick={onSettings} className="w-full p-3 font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer"><Settings size={18} /> 返回設定</button>
    </div>
  </div>;
}
