export type QuestionModeId = 'ADD_20' | 'ADD_50' | 'ADD_100' | 'NUMBER_SENSE';

export type GameState = 'PLAYING' | 'BOSS_FIGHT' | 'SUMMARY';

export type Lane = 'LEFT' | 'RIGHT';

export interface WeaponInfo {
  tier: number;
  name: string;
  multiplier: number;
  minCorrect: number;
  color: string;
  projectileColor: string;
  description: string;
}

export interface QuestionModeConfig {
  id: QuestionModeId;
  title: string;
  shortTitle: string;
  subtitle: string;
  rangeLabel: string;
  badgeColor: string;
  initialTroops: number;
  baseRewardTroops: number;
  penaltyTroops: number;
  timeLimitSeconds: number;
  bossName: string;
  bossMaxHp: number;
}

export interface QuestionItem {
  id: number;
  index: number; // 1..10
  prompt: string;
  numA?: number;
  numB?: number;
  operator?: '+';
  leftOption: number;
  rightOption: number;
  correctLane: Lane;
  correctAnswer: number;
  wrongAnswer: number;
  rewardTroops: number;
  penaltyTroops: number;
}

export interface AnswerRecord {
  questionIndex: number;
  prompt: string;
  chosenAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  troopsDelta: number;
}

export interface ModeProgress {
  highScore: number;
  bestTroops: number;
  stars: number;
  gamesPlayed: number;
}

export type ProgressMap = Record<QuestionModeId, ModeProgress>;
