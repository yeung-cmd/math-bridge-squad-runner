import { AnswerRecord } from '../types/game';

export type MissionId = 'accuracy' | 'streak' | 'boss';

export const MISSION_DEFINITIONS: Array<{
  id: MissionId;
  title: string;
  description: string;
  target: number;
}> = [
  { id: 'accuracy', title: '答題高手', description: '答對 15 題', target: 15 },
  { id: 'streak', title: '連勝勇士', description: '連續答對 5 題', target: 5 },
  { id: 'boss', title: '首領剋星', description: '擊敗守關首領', target: 1 }
];

export interface MissionProgress {
  id: MissionId;
  title: string;
  description: string;
  target: number;
  value: number;
  complete: boolean;
}

export function getMissionProgress(records: AnswerRecord[], bossDefeated = false): MissionProgress[] {
  const correctAnswers = records.filter((record) => record.isCorrect).length;
  let currentStreak = 0;
  let longestStreak = 0;

  for (const record of records) {
    currentStreak = record.isCorrect ? currentStreak + 1 : 0;
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  const values: Record<MissionId, number> = {
    accuracy: correctAnswers,
    streak: longestStreak,
    boss: bossDefeated ? 1 : 0
  };

  return MISSION_DEFINITIONS.map((mission) => ({
    ...mission,
    value: Math.min(values[mission.id], mission.target),
    complete: values[mission.id] >= mission.target
  }));
}
