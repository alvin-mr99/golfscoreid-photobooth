// Flight Models
export interface Flight {
  _id: string;
  flight_name: string;
  tee_off_time: number;
  status: string;
  players: FlightPlayer[];
  created_at: number;
}

export interface FlightPlayer {
  _id: string;
  name: string;
  bag_tag_number?: string;
  phone_number?: string;
  rv_id?: string;
  payment_status?: string;
}

// Score Models
export interface ScoreData {
  flightId: string;
  flightName: string;
  teeOffTime: number;
  players: PlayerScore[];
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  scores: HoleScore[];
  totalScore: number;
  handicap?: number;
}

export interface HoleScore {
  holeNumber: number;
  strokes: number;
  par: number;
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
