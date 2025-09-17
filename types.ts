


export enum TieBreakerRule {
  NONE = 'NONE',
  ALL_TIES = 'ALL_TIES',
  FIRST_PLACE_ONLY = 'FIRST_PLACE_ONLY'
}

export enum PrizeMode {
  PER_ROUND = 'PER_ROUND',
  BANK = 'BANK'
}

export interface GameSettings {
  tieBreakerRule: TieBreakerRule;
  rules?: string;
  prizeMode: PrizeMode;
  enableBuzzer?: boolean;
}

export interface Team {
  id: string;
  name: string;
  collectedPrizes: Prize[];
  scores: Record<string, number>; // roundId -> score
}

export interface Prize {
  id?: string;
  name: string;
  imageUrl?: string;
}

export enum QuestionType {
  QUIZ = 'QUIZ',
  LIVE = 'LIVE',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
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
  imageUrl?: string;
  imageFileName?: string;
  cropData?: CropData;
}

export interface Round {
  id: string;
  name: string;
  questions: Question[];
  prizePool?: Prize[];
  isCompleted: boolean;
  prizeCategory?: string;
}