// Flight Models
export interface Flight {
  _id: string;
  flight_name: string;
  tee_off_time: number;
  status: string;
  start_hole?: number;
  game_mode?: string;
  course_type?: string;
  scoring_system?: string;
  course_id?: string;
  players: FlightPlayer[];
  created_at: number;
  verification_code?: string; // 4-digit verification code
}

export interface FlightPlayer {
  _id: string;
  name: string;
  bag_tag_number?: string;
  phone_number?: string;
  rv_id?: string;
  payment_status?: string;
  handicap?: number;
}

// Score Models
export interface ScoreData {
  flightId: string;
  flightName: string;
  teeOffTime: number;
  startHole?: number;
  gameMode?: string;
  courseType?: string;
  scoringSystem?: string;
  courseName?: string;
  players: PlayerScore[];
  holes: HoleInfo[];
}

export interface HoleInfo {
  holeNumber: number;
  par: number;
  index: number;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  scores: HoleScore[];
  totalScore: number;
  handicap?: number;
  bagTagNumber?: string;
}

export interface HoleScore {
  holeNumber: number;
  strokes: number;
  putts?: number;
}

// Photo Models
export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}

// Application State
export interface AppState {
  currentPage: 'welcome' | 'score-photo';
  selectedFlight: Flight | null;
  scoreData: ScoreData | null;
  capturedPhotos: CapturedPhoto[];
  selectedPhotoIds: string[];
  cameraStream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
}
