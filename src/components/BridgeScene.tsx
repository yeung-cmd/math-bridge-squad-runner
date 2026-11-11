import React from 'react';
import { Lane, QuestionItem, WeaponInfo } from '../types/game';

interface BridgeSceneProps {
  question: QuestionItem;
  troops: number;
  selectedLane: Lane | null;
  gateProgress: number; // 0.0 (far horizon) -> 1.0 (reaches squad)
  isAdvancing: boolean;
  impactResult: 'CORRECT' | 'WRONG' | null;
  weapon: WeaponInfo;
  onSelectLane: (lane: Lane) => void;
  floatingFeedback: { text: string; subtext?: string; isPositive: boolean } | null;
}

export const BridgeScene: React.FC<BridgeSceneProps> = ({
  question,
  troops,
  selectedLane,
  gateProgress,
  isAdvancing,
  impactResult,
  weapon,
  onSelectLane,
  floatingFeedback
}) => {
  // Compute visible soldiers in formation (between 1 and 25 sprites arranged in neat rows)
  const visibleCount = Math.max(1, Math.min(25, troops));

  // Build rows of soldiers
  const rows: number[][] = [];
  let remaining = visibleCount;
  const rowCapacities = [5, 6, 5, 5, 4];
  for (let r = 0; r < rowCapacities.length && remaining > 0; r++) {
    const countInRow = Math.min(rowCapacities[r], remaining);
    rows.push(Array.from({ length: countInRow }, (_, idx) => idx));
    remaining -= countInRow;
  }

  // Horizontal offset of the squad when a lane is selected
  const squadOffsetX =
    selectedLane === 'LEFT' ? -68 : selectedLane === 'RIGHT' ? 68 : 0;

  // Perspective interpolation for the approaching gates based on gateProgress (0 -> 1)
  // At progress=0 (just below question banner): top = 26%, scale = 0.52, width = 46%
  // At progress=1 (reaching the running soldiers): top = 53%, scale = 1.08, width = 88%
  const clampedP = Math.max(0, Math.min(1.05, gateProgress));
  // Slight perspective curve so it accelerates visually as it gets closer to the camera
  const visualP = Math.pow(clampedP, 1.15);
  const gateTopPercent = 26.5 + visualP * 26.5;
  const gateScale = 0.54 + visualP * 0.54;
  const gateSpreadPercent = 48 + visualP * 38;

  // Compute scrolling horizontal bridge planks using gateProgress * speed so the bridge visibly scrolls!
  const scrollPhase = (gateProgress * 18) % 1;
  const plankPositions = [0, 0.16, 0.32, 0.48, 0.64, 0.8, 0.96].map((base) => {
    const t = (base + scrollPhase) % 1;
    // Perspective mapping from y=165 (horizon) to y=700 (bottom)
    const perspT = Math.pow(t, 1.45);
    const y = 165 + perspT * 535;
    // Bridge deck left/right edges at height y:
    // At y=150: xLeft=172, xRight=228
    // At y=700: xLeft=54, xRight=346
    const ratio = (y - 150) / 550;
    const xLeft = 172 - ratio * (172 - 54);
    const xRight = 228 + ratio * (346 - 228);
    // Railing post outer positions
    const railLeft = 158 - ratio * (158 - 24);
    const railRight = 242 + ratio * (376 - 242);
    return { y, xLeft, xRight, railLeft, railRight, ratio };
  });

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#38A7F8]">
      {/* SVG Perspective Ocean & Scrolling Bridge Deck */}
      <svg
        viewBox="0 0 400 700"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#46B2FF" />
            <stop offset="55%" stopColor="#359FF5" />
            <stop offset="100%" stopColor="#268BE2" />
          </linearGradient>
          <linearGradient id="bridgeDeckGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B69B7D" />
            <stop offset="50%" stopColor="#BCA080" />
            <stop offset="100%" stopColor="#B39676" />
          </linearGradient>
        </defs>

        {/* Ocean Background */}
        <rect x="0" y="0" width="400" height="700" fill="url(#oceanGrad)" />

        {/* Continuously Flowing Ocean Waves on Left & Right */}
        <g
          stroke="#268BE2"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.75"
          className="animate-ocean-flow"
        >
          <path d="M 10 220 Q 45 214 85 222" fill="none" />
          <path d="M -5 290 Q 40 282 95 292" fill="none" />
          <path d="M 15 360 Q 50 355 80 363" fill="none" />
          <path d="M 5 430 Q 38 423 68 432" fill="none" />
          <path d="M 12 500 Q 42 493 72 502" fill="none" />
          <path d="M 8 570 Q 36 563 60 572" fill="none" />

          <path d="M 315 215 Q 355 208 395 217" fill="none" />
          <path d="M 305 285 Q 350 278 405 288" fill="none" />
          <path d="M 320 355 Q 360 348 395 356" fill="none" />
          <path d="M 332 425 Q 365 418 398 426" fill="none" />
          <path d="M 338 495 Q 368 488 396 496" fill="none" />
          <path d="M 345 565 Q 372 558 398 566" fill="none" />
        </g>

        {/* Left & Right Bridge Railings / Curbs (Darker Brown) */}
        <polygon points="158,150 242,150 376,700 24,700" fill="#7D6247" />

        {/* Main Perspective Bridge Deck (Warm Tan) */}
        <polygon
          points="172,150 228,150 346,700 54,700"
          fill="url(#bridgeDeckGrad)"
        />

        {/* Continuously Scrolling Perspective Bridge Planks & Railing Ties */}
        <g>
          {plankPositions.map((p, idx) => (
            <React.Fragment key={idx}>
              {/* Bridge Deck Plank Line */}
              <line
                x1={p.xLeft}
                y1={p.y}
                x2={p.xRight}
                y2={p.y}
                stroke="#9C8062"
                strokeWidth={1 + p.ratio * 2}
                opacity={0.35 + p.ratio * 0.45}
              />
              {/* Left Curb Marker */}
              <line
                x1={p.railLeft}
                y1={p.y}
                x2={p.xLeft}
                y2={p.y}
                stroke="#5E4731"
                strokeWidth={1.5 + p.ratio * 2.5}
                opacity={0.6}
              />
              {/* Right Curb Marker */}
              <line
                x1={p.xRight}
                y1={p.y}
                x2={p.railRight}
                y2={p.y}
                stroke="#5E4731"
                strokeWidth={1.5 + p.ratio * 2.5}
                opacity={0.6}
              />
            </React.Fragment>
          ))}
        </g>

        {/* Animated Scrolling Center Lane Divider */}
        <line
          x1="200"
          y1="165"
          x2="200"
          y2="690"
          stroke="#917557"
          strokeWidth="2.5"
          strokeDasharray="18 18"
          opacity="0.6"
          className="animate-bridge-dash"
        />
      </svg>

      {/* DYNAMICALLY APPROACHING NUMBERED GATES (Left & Right) */}
      <div
        style={{
          top: `${gateTopPercent}%`,
          transform: `translateY(-50%) scale(${gateScale})`
        }}
        className="absolute left-0 right-0 flex justify-center items-center pointer-events-auto z-10 will-change-transform"
      >
        <div
          style={{ width: `${gateSpreadPercent}%` }}
          className="max-w-[340px] flex justify-between items-center px-2"
        >
          {/* LEFT GATE */}
          <button
            type="button"
            onClick={() => onSelectLane('LEFT')}
            aria-label={`左邊跑道 ${question.leftOption}`}
            className={`group relative w-[78px] h-[72px] flex items-center justify-center transition-transform duration-150 cursor-pointer ${
              selectedLane === 'LEFT' ? 'scale-108' : 'hover:scale-105'
            } ${
              impactResult && selectedLane === 'LEFT'
                ? impactResult === 'CORRECT'
                  ? 'scale-135 brightness-125 opacity-0 transition-all duration-300'
                  : 'animate-bounce brightness-90'
                : ''
            }`}
          >
            {/* Left & Right Wooden Gate Posts */}
            <div className="absolute -left-1.5 bottom-[-6px] w-2.5 h-11 bg-[#C6A074] rounded-xs border-r border-[#9E7B52]" />
            <div className="absolute -right-1.5 bottom-[-6px] w-2.5 h-11 bg-[#C6A074] rounded-xs border-l border-[#9E7B52]" />

            {/* Gate Outer White Top/Side Frame + Blue Panel */}
            <div
              className={`w-full h-full rounded-t-xl rounded-b-sm bg-[#1974F2] border-t-[3.5px] border-x-[3.5px] flex items-center justify-center shadow-lg transition-colors ${
                selectedLane === 'LEFT'
                  ? 'border-amber-300 ring-4 ring-amber-300/50'
                  : 'border-white'
              }`}
            >
              <span className="font-display font-black text-white text-3xl tracking-tight tabular-nums drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">
                {question.leftOption}
              </span>
            </div>
          </button>

          {/* RIGHT GATE */}
          <button
            type="button"
            onClick={() => onSelectLane('RIGHT')}
            aria-label={`右邊跑道 ${question.rightOption}`}
            className={`group relative w-[78px] h-[72px] flex items-center justify-center transition-transform duration-150 cursor-pointer ${
              selectedLane === 'RIGHT' ? 'scale-108' : 'hover:scale-105'
            } ${
              impactResult && selectedLane === 'RIGHT'
                ? impactResult === 'CORRECT'
                  ? 'scale-135 brightness-125 opacity-0 transition-all duration-300'
                  : 'animate-bounce brightness-90'
                : ''
            }`}
          >
            {/* Left & Right Wooden Gate Posts */}
            <div className="absolute -left-1.5 bottom-[-6px] w-2.5 h-11 bg-[#C6A074] rounded-xs border-r border-[#9E7B52]" />
            <div className="absolute -right-1.5 bottom-[-6px] w-2.5 h-11 bg-[#C6A074] rounded-xs border-l border-[#9E7B52]" />

            {/* Gate Outer White Top/Side Frame + Blue Panel */}
            <div
              className={`w-full h-full rounded-t-xl rounded-b-sm bg-[#1974F2] border-t-[3.5px] border-x-[3.5px] flex items-center justify-center shadow-lg transition-colors ${
                selectedLane === 'RIGHT'
                  ? 'border-amber-300 ring-4 ring-amber-300/50'
                  : 'border-white'
              }`}
            >
              <span className="font-display font-black text-white text-3xl tracking-tight tabular-nums drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">
                {question.rightOption}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Floating Impact Feedback (+Troops / Weapon Upgrade / Penalty) */}
      {floatingFeedback && (
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center animate-bounce">
          <div
            className={`px-4 py-1.5 rounded-full font-display font-black text-xl shadow-lg border-2 ${
              floatingFeedback.isPositive
                ? 'bg-emerald-500 text-white border-white'
                : 'bg-rose-600 text-white border-white'
            }`}
          >
            {floatingFeedback.text}
          </div>
          {floatingFeedback.subtext && (
            <div className="mt-1 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow border border-white whitespace-nowrap">
              {floatingFeedback.subtext}
            </div>
          )}
        </div>
      )}

      {/* THE BLUE SOLDIER SQUAD FORMATION (Actively Running Forward on the Bridge!) */}
      <div
        style={{
          transform: `translate3d(${squadOffsetX}px, ${isAdvancing ? '-24px' : '0px'}, 0)`
        }}
        className="absolute top-[55%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-transform duration-200 ease-out pointer-events-none"
      >
        {/* Top Troop Counter Pill Badge ("22") */}
        <div className="relative z-30 mb-[-3px] px-3.5 py-0.5 rounded-full bg-[#242F3E]/95 border border-white/30 shadow-md flex items-center justify-center">
          <span className="font-display font-black text-white text-lg leading-tight tabular-nums tracking-tight">
            {troops}
          </span>
        </div>

        {/* Soldier Formation Rows with Active Running Animation */}
        <div
          className={`flex flex-col items-center space-y-[-9px] ${
            isAdvancing ? 'animate-march-fast' : 'animate-march'
          }`}
        >
          {rows.map((rowSoldiers, rowIndex) => {
            const isBackRow = rowIndex === 0;
            return (
              <div
                key={rowIndex}
                style={{ zIndex: 10 + rowIndex }}
                className="flex items-center justify-center space-x-[-3px]"
              >
                {rowSoldiers.map((soldierIdx) => {
                  const hasSpear = isBackRow;
                  const hasGun = !isBackRow || weapon.tier >= 2;

                  return (
                    <div
                      key={soldierIdx}
                      className="relative w-7 h-11 flex flex-col items-center"
                    >
                      {/* Upright Glowing Cyan Spear for Back-Row Soldiers */}
                      {hasSpear && (
                        <div className="absolute -top-4 left-0.5 flex flex-col items-center z-0">
                          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[12px] border-b-[#22D3EE] drop-shadow-[0_0_2px_#ffffff]" />
                          <div className="w-[3px] h-7 bg-[#855832]" />
                        </div>
                      )}

                      {/* Cute Blocky Blue Helmet */}
                      <div className="relative z-10 w-5 h-2.5 rounded-t-sm bg-[#2563EB] border-t border-x border-[#60A5FA] flex items-center">
                        <div className="w-1.5 h-1.5 bg-white/90 ml-0.5 rounded-xs" />
                      </div>

                      {/* Face */}
                      <div className="relative z-10 w-4 h-2.5 bg-[#FDBA8C] flex items-center justify-around px-0.5">
                        <span className="w-0.5 h-0.5 rounded-full bg-slate-900" />
                        <span className="w-0.5 h-0.5 rounded-full bg-slate-900" />
                      </div>

                      {/* Blue Uniform Body + Heavy Shotgun */}
                      <div className="relative z-10 w-5 h-3 bg-[#1D4ED8] rounded-b-xs flex items-center justify-center">
                        <div className="w-2 h-1.5 bg-white/85 rounded-xs" />
                        {hasGun && (
                          <div className="absolute -right-3 top-0.5 flex items-center">
                            <div className="w-2 h-1.5 bg-[#78472A] rounded-l-xs" />
                            <div
                              className="w-3.5 h-1.5 rounded-r-xs"
                              style={{
                                backgroundColor:
                                  weapon.tier >= 4 ? weapon.color : '#475569'
                              }}
                            />
                            <div className="w-1 h-1.5 bg-rose-500 rounded-r-xs" />
                          </div>
                        )}
                      </div>

                      {/* Animated Alternating Running Boots/Legs! */}
                      <div className="relative z-10 flex gap-1 -mt-0.5">
                        <div className="w-1.5 h-2 bg-[#1E3A8A] rounded-b-xs animate-leg-left" />
                        <div className="w-1.5 h-2 bg-[#1E3A8A] rounded-b-xs animate-leg-right" />
                      </div>

                      {/* Shadow + Running Dust Puff under Soldier */}
                      <div className="w-5 h-1.5 rounded-full bg-black/25 -mt-0.5" />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
