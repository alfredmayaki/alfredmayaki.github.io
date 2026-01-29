
export interface Participant {
  id: number;
  name: string;
  short_code: string;
  image_path: string;
  meta: {
    location: 'home' | 'away';
    winner: boolean;
    position: number;
  };
}

export interface Score {
  id: number;
  participant_id: number;
  score: {
    goals: number;
    participant: string;
  };
  description: string;
}

export interface EventType {
  id: number;
  name: string;
  code: string;
}

export interface MatchEvent {
  id: number;
  type_id: number;
  minute: number;
  extra_minute?: number | null;
  player_name: string;
  related_player_name?: string | null;
  type: EventType;
  participant_id: number;
}

export interface Comment {
  id: number;
  comment: string;
  minute: number | null;
  extra_minute?: number | null;
  is_goal: boolean;
  is_important: boolean;
}

export interface Fixture {
  id: number;
  name: string;
  starting_at: string;
  result_info: string;
  league: {
    name: string;
    image_path: string;
  };
  venue: {
    name: string;
    city_name: string;
    image_path: string;
  };
  state: {
    name: string;
    short_name: string;
  };
  participants: Participant[];
  scores: Score[];
  events: MatchEvent[];
  comments: Comment[];
}

export interface UnifiedTimelineItem {
  id: string;
  type: 'event' | 'comment';
  minute: number;
  extra_minute?: number | null;
  content: string;
  isImportant?: boolean;
  isGoal?: boolean;
  eventType?: string;
  playerName?: string;
  participantId?: number;
}
