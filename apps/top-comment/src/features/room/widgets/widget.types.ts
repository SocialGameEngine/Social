export interface ActivityItem {
  id: string;
  type: 'join' | 'answer' | 'vote' | 'phase_change';
  user: string;
  message: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  totalVotes: number;
  isActive: boolean;
  userVote?: string;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isAnswered: boolean;
  userAnswer?: string;
}
