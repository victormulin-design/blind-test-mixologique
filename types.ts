
export enum TieBreakerRule {
  NONE = 'NONE',
  ALL_TIES = 'ALL_TIES',
  FIRST_PLACE_ONLY = 'FIRST_PLACE_ONLY'
}

export interface GameSettings {
  tieBreakerRule: TieBreakerRule;
  rules?: string;
}

export interface Team {
  id: string;
  name: string;
  collectedPrizes: Prize[];
  scores: Record<string, number>; // roundId -> score
}

export interface Prize {
  // FIX: Made the 'id' property optional to allow for creation during setup without an ID.
  id?: string;
  name: string;
  imageUrl: string;
}

export enum QuestionType {
  LIVE = 'LIVE',
  AUDIO = 'AUDIO',
}

export interface Question {
  questionText: string;
  clue?: string;
  type: QuestionType;
  answer: string;
  audioUrl?: string;
  audioFileName?: string;
  timer?: number; // in seconds
  points?: number;
  audioStartTime?: number; // in seconds
  audioEndTime?: number; // in seconds
  answerStartTime?: number; // in seconds
  splitAnswer?: boolean;
}

export interface Round {
  id: string;
  name: string;
  questions: Question[];
  prizePool: Prize[];
  isCompleted: boolean;
  prizeCategory?: string;
}