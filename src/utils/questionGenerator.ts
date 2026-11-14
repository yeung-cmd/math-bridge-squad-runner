import { QuestionItem, QuestionModeConfig, QuestionModeId, WeaponInfo } from '../types/game';

export const WEAPON_TIERS: WeaponInfo[] = [
  {
    tier: 1,
    name: '新手長矛',
    multiplier: 1.0,
    minCorrect: 0,
    color: '#38BDF8',
    projectileColor: '#7DD3FC',
    description: '基礎近戰長矛，穩定推進戰線'
  },
  {
    tier: 2,
    name: '輕型步槍',
    multiplier: 1.5,
    minCorrect: 4,
    color: '#4ADE80',
    projectileColor: '#86EFAC',
    description: '精準點射步槍，火力提升 1.5 倍'
  },
  {
    tier: 3,
    name: '重裝散彈槍',
    multiplier: 2.5,
    minCorrect: 8,
    color: '#FB923C',
    projectileColor: '#FDBA74',
    description: '扇形高爆散彈，火力提升 2.5 倍'
  },
  {
    tier: 4,
    name: '雙管機關槍',
    multiplier: 4.0,
    minCorrect: 13,
    color: '#F43F5E',
    projectileColor: '#FDA4AF',
    description: '高速連射壓制，火力提升 4.0 倍'
  },
  {
    tier: 5,
    name: '雷霆激光砲',
    multiplier: 6.0,
    minCorrect: 18,
    color: '#A855F7',
    projectileColor: '#E9D5FF',
    description: '終極貫穿激光，火力提升 6.0 倍'
  }
];

export const QUESTION_MODES: Record<QuestionModeId, QuestionModeConfig> = {
  ADD_20: {
    id: 'ADD_20',
    title: '二十位加數',
    shortTitle: '20以內加數',
    subtitle: '和數 20 以內的基礎加法心算',
    rangeLabel: '和數 ≤ 20',
    badgeColor: '#10B981',
    initialTroops: 14,
    baseRewardTroops: 3,
    penaltyTroops: 3,
    timeLimitSeconds: 60,
    bossName: '巨型鐵甲守衛',
    bossMaxHp: 600
  },
  ADD_50: {
    id: 'ADD_50',
    title: '五十位加數',
    shortTitle: '50以內加數',
    subtitle: '和數 21 至 50 的雙位數加法訓練',
    rangeLabel: '和數 ≤ 50',
    badgeColor: '#3B82F6',
    initialTroops: 16,
    baseRewardTroops: 4,
    penaltyTroops: 4,
    timeLimitSeconds: 60,
    bossName: '深海重砲巨蟹',
    bossMaxHp: 850
  },
  ADD_100: {
    id: 'ADD_100',
    title: '一百位內加數',
    shortTitle: '100以內加數',
    subtitle: '和數 51 至 100 的進階進位加法挑戰',
    rangeLabel: '和數 ≤ 100',
    badgeColor: '#F59E0B',
    initialTroops: 18,
    baseRewardTroops: 5,
    penaltyTroops: 4,
    timeLimitSeconds: 75,
    bossName: '烈焰鋼鐵巨龍',
    bossMaxHp: 1100
  },
  NUMBER_SENSE: {
    id: 'NUMBER_SENSE',
    title: '基礎數感題',
    shortTitle: '前後數與數感',
    subtitle: '原圖經典模式：前一個數、後一個數與相鄰數',
    rangeLabel: '經典原圖題型',
    badgeColor: '#EC4899',
    initialTroops: 14,
    baseRewardTroops: 2,
    penaltyTroops: 2,
    timeLimitSeconds: 60,
    bossName: '迷宮岩石領主',
    bossMaxHp: 550
  },
  MULTIPLY_DIGITS: {
    id: 'MULTIPLY_DIGITS',
    title: '個位乘個位（2–9）',
    shortTitle: '個位乘法',
    subtitle: '熟習 2 至 9 的乘法表',
    rangeLabel: '2–9 × 2–9',
    badgeColor: '#8B5CF6',
    initialTroops: 16,
    baseRewardTroops: 4,
    penaltyTroops: 3,
    timeLimitSeconds: 60,
    bossName: '乘法魔王',
    bossMaxHp: 900
  }
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSmartDistractor(correct: number, minVal: number, maxVal: number): number {
  const candidates: number[] = [];
  const offsets = [-1, 1, -2, 2, -10, 10, -3, 3];
  for (const offset of offsets) {
    const val = correct + offset;
    if (val >= minVal && val <= maxVal && val !== correct) {
      candidates.push(val);
    }
  }
  if (candidates.length === 0) {
    return correct + 1;
  }
  const primary = candidates.slice(0, 4);
  const pool = Math.random() < 0.75 && primary.length > 0 ? primary : candidates;
  return pool[randomInt(0, pool.length - 1)];
}

export const QUESTIONS_PER_LEVEL = 20;

export function generateQuestionSet(modeId: QuestionModeId, totalQuestions = QUESTIONS_PER_LEVEL): QuestionItem[] {
  const config = QUESTION_MODES[modeId];
  const questions: QuestionItem[] = [];
  const usedPrompts = new Set<string>();

  for (let i = 1; i <= totalQuestions; i++) {
    let prompt = '';
    let numA: number | undefined = undefined;
    let numB: number | undefined = undefined;
    let operator: '+' | '×' | undefined = undefined;
    let correctAnswer = 0;
    let wrongAnswer = 0;

    if (modeId === 'ADD_20') {
      for (let attempt = 0; attempt < 20; attempt++) {
        const progress = i / totalQuestions;
        const minSum = progress <= 0.2 ? 5 : progress <= 0.45 ? 8 : progress <= 0.7 ? 11 : 14;
        const maxSum = 20;
        const sum = randomInt(minSum, maxSum);
        const a = randomInt(2, sum - 2);
        const b = sum - a;
        const candidatePrompt = `${a} + ${b} = ?`;
        if (!usedPrompts.has(candidatePrompt) || attempt === 19) {
          usedPrompts.add(candidatePrompt);
          prompt = candidatePrompt;
          numA = a;
          numB = b;
          operator = '+';
          correctAnswer = sum;
          wrongAnswer = generateSmartDistractor(sum, 2, 20);
          break;
        }
      }
    } else if (modeId === 'ADD_50') {
      for (let attempt = 0; attempt < 20; attempt++) {
        const minSum = i / totalQuestions <= 0.2 ? 21 : 28;
        const maxSum = 50;
        const sum = randomInt(minSum, maxSum);
        const a = randomInt(6, sum - 6);
        const b = sum - a;
        const candidatePrompt = `${a} + ${b} = ?`;
        if (!usedPrompts.has(candidatePrompt) || attempt === 19) {
          usedPrompts.add(candidatePrompt);
          prompt = candidatePrompt;
          numA = a;
          numB = b;
          operator = '+';
          correctAnswer = sum;
          wrongAnswer = generateSmartDistractor(sum, 15, 50);
          break;
        }
      }
    } else if (modeId === 'ADD_100') {
      for (let attempt = 0; attempt < 20; attempt++) {
        const minSum = i / totalQuestions <= 0.2 ? 51 : 65;
        const maxSum = 100;
        const sum = randomInt(minSum, maxSum);
        const a = randomInt(14, sum - 14);
        const b = sum - a;
        const candidatePrompt = `${a} + ${b} = ?`;
        if (!usedPrompts.has(candidatePrompt) || attempt === 19) {
          usedPrompts.add(candidatePrompt);
          prompt = candidatePrompt;
          numA = a;
          numB = b;
          operator = '+';
          correctAnswer = sum;
          wrongAnswer = generateSmartDistractor(sum, 40, 100);
          break;
        }
      }
    } else if (modeId === 'NUMBER_SENSE') {
      if (i === 5) {
        prompt = '8 的前一個數是？';
        correctAnswer = 7;
        wrongAnswer = 8;
        usedPrompts.add(prompt);
      } else {
        for (let attempt = 0; attempt < 20; attempt++) {
          const kind = randomInt(0, 3);
          if (kind === 0) {
            const n = randomInt(3, 25);
            prompt = `${n} 的前一個數是？`;
            correctAnswer = n - 1;
            wrongAnswer = Math.random() < 0.65 ? n : n + 1;
          } else if (kind === 1) {
            const n = randomInt(2, 25);
            prompt = `${n} 的後一個數是？`;
            correctAnswer = n + 1;
            wrongAnswer = Math.random() < 0.65 ? n : n - 1;
          } else if (kind === 2) {
            const n = randomInt(4, 28);
            prompt = `比 ${n} 大 2 的數是？`;
            correctAnswer = n + 2;
            wrongAnswer = n + 1;
          } else {
            const n = randomInt(5, 29);
            prompt = `${n - 1} 和 ${n + 1} 中間的數是？`;
            correctAnswer = n;
            wrongAnswer = n + 1;
          }
          if (!usedPrompts.has(prompt) || attempt === 19) {
            usedPrompts.add(prompt);
            break;
          }
        }
      }
    } else {
      for (let attempt = 0; attempt < 20; attempt++) {
        const a = randomInt(2, 9);
        const b = randomInt(2, 9);
        const candidatePrompt = `${a} × ${b} = ?`;
        if (!usedPrompts.has(candidatePrompt) || attempt === 19) {
          usedPrompts.add(candidatePrompt);
          prompt = candidatePrompt;
          numA = a;
          numB = b;
          operator = '×';
          correctAnswer = a * b;
          wrongAnswer = generateSmartDistractor(correctAnswer, 2, 81);
          break;
        }
      }
    }

    let correctLane: 'LEFT' | 'RIGHT' = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
    if (modeId === 'NUMBER_SENSE' && i === 5 && prompt === '8 的前一個數是？') {
      correctLane = 'RIGHT';
    }

    const leftOption = correctLane === 'LEFT' ? correctAnswer : wrongAnswer;
    const rightOption = correctLane === 'RIGHT' ? correctAnswer : wrongAnswer;

    questions.push({
      id: i,
      index: i,
      prompt,
      numA,
      numB,
      operator,
      leftOption,
      rightOption,
      correctLane,
      correctAnswer,
      wrongAnswer,
      rewardTroops: config.baseRewardTroops,
      penaltyTroops: config.penaltyTroops
    });
  }

  return questions;
}

export function getWeaponForCorrectCount(correctCount: number): WeaponInfo {
  let active = WEAPON_TIERS[0];
  for (const tier of WEAPON_TIERS) {
    if (correctCount >= tier.minCorrect) {
      active = tier;
    }
  }
  return active;
}
