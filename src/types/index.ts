export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'SUPER_ADMIN';
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt: string;
  _count?: { events: number };
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  eventDate?: string;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  _count?: { participants: number; judges: number; portions: number };
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  number: number;
  createdAt: string;
}

export interface Judge {
  id: string;
  eventId: string;
  name: string;
  email: string;
  token: string;
  isActive: boolean;
  createdAt: string;
}

export interface Criterion {
  id: string;
  portionId: string;
  name: string;
  weight: number;
  maxScore: number;
  createdAt: string;
}

export interface Portion {
  id: string;
  eventId: string;
  name: string;
  weight: number;
  order: number;
  createdAt: string;
  criteria: Criterion[];
}

export interface EventDetail extends Event {
  participants: Participant[];
  judges: Judge[];
  portions: Portion[];
}

export interface Score {
  id: string;
  judgeId: string;
  participantId: string;
  criteriaId: string;
  score: number;
}

export interface CriteriaBreakdown {
  criteriaId: string;
  criteriaName: string;
  weight: number;
  avgScore: number;
  weightedScore: number;
}

export interface PortionBreakdown {
  portionId: string;
  portionName: string;
  portionWeight: number;
  portionScore: number;
  weightedContribution: number;
  criteriaBreakdown: CriteriaBreakdown[];
}

export interface JudgeScore {
  judgeId: string;
  judgeName: string;
  portionTotals: { portionId: string; portionName: string; score: number }[];
  finalTotal: number;
}

export interface ParticipantResult {
  rank: number;
  participant: { id: string; name: string; number: number };
  finalScore: number;
  portionBreakdown: PortionBreakdown[];
  judgeScores: JudgeScore[];
}

export interface ResultsData {
  event: Event;
  results: ParticipantResult[];
}

export interface JudgePanel {
  judge: { id: string; name: string };
  event: { id: string; name: string; description?: string; status: string };
  participants: Participant[];
  portions: Portion[]; // each portion has .criteria[]
  existingScores: Record<string, number>; // "participantId_criteriaId" -> score
}

export interface ScoringProgress {
  totalExpected: number;
  totalSubmitted: number;
  percentComplete: number;
  judgeProgress: {
    judgeId: string;
    judgeName: string;
    submitted: number;
    expected: number;
    percent: number;
  }[];
}

export interface PlatformStats {
  users: { total: number; active: number; superAdmins: number };
  events: { total: number; draft: number; active: number; completed: number };
  totalParticipants: number;
  totalJudges: number;
  totalScores: number;
  recentUsers: User[];
  recentEvents: (Event & { user: { name: string; email: string } })[];
}

export interface AdminUser extends User {
  events?: Event[];
}