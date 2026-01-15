import { ConvexHttpClient } from 'convex/browser';
import type { Flight, ScoreData, PlayerScore, HoleScore } from '../types';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || 'http://103.75.101.39:3252';
const ADMIN_KEY = import.meta.env.VITE_CONVEX_ADMIN_KEY || 'golf-pangjat-staging|01785a23a0a947bc815b5d3a8614354ab56f92ac09afea3dc1a9258f193116f7f03a373c9d';
const CACHE_DURATION = 30000; // 30 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ConvexService {
  private client: ConvexHttpClient;
  private flightsCache: CacheEntry<Flight[]> | null = null;

  constructor() {
    this.client = new ConvexHttpClient(CONVEX_URL);
    // Set admin authentication
    this.client.setAuth(ADMIN_KEY);
  }

  /**
   * Make a direct HTTP request to Convex API
   */
  private async makeRequest(functionPath: string, args: any = {}): Promise<any> {
    try {
      const response = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Convex ${ADMIN_KEY}`,
        },
        body: JSON.stringify({
          path: functionPath,
          args: args,
          format: 'json',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.errorMessage || 'Convex query failed');
      }

      return data.value;
    } catch (error) {
      console.error(`Error calling ${functionPath}:`, error);
      throw error;
    }
  }

  /**
   * Get all flights with player data
   * Implements 30-second caching to reduce API calls
   * Only returns flights with status "completed"
   */
  async getFlights(): Promise<Flight[]> {
    const now = Date.now();
    
    // Check cache validity
    if (this.flightsCache && (now - this.flightsCache.timestamp) < CACHE_DURATION) {
      return this.flightsCache.data;
    }

    try {
      // Query flights with players using the existing Convex function
      const allFlights = await this.makeRequest('flights:getAllWithPlayers');
      
      // Filter only completed flights
      const completedFlights = (allFlights as Flight[]).filter(
        flight => flight.status === 'completed'
      );
      
      // Update cache
      this.flightsCache = {
        data: completedFlights,
        timestamp: now,
      };

      return completedFlights;
    } catch (error) {
      console.error('Error fetching flights:', error);
      throw new Error('Failed to fetch flights from Convex. Please check your connection.');
    }
  }

  /**
   * Get scoring data for a specific flight
   */
  async getFlightScore(flightId: string): Promise<ScoreData> {
    try {
      // Fetch flight details
      const flights = await this.getFlights();
      const flight = flights.find(f => f._id === flightId);
      
      if (!flight) {
        throw new Error('Flight not found');
      }

      // Fetch tablet_rounds to verify scoring has started
      let rounds;
      try {
        rounds = await this.makeRequest('tablet_rounds:getByFlight', { flightId });
      } catch (err) {
        console.error('Error fetching rounds:', err);
        throw new Error('Failed to fetch round data. Please check if scoring data exists for this flight.');
      }
      
      if (!rounds || rounds.length === 0) {
        throw new Error('No round data found for this flight. Please ensure scoring has been started.');
      }

      // Fetch tablet_scores for this flight (not by round, by flight)
      let scores;
      try {
        scores = await this.makeRequest('tablet_scores:getByFlight', { flightId });
      } catch (err) {
        console.error('Error fetching scores:', err);
        // If no scores yet, return empty array
        scores = [];
      }

      // Fetch player details from flight_players
      let players;
      try {
        players = await this.makeRequest('flight_players:getByFlight', { flightId });
      } catch (err) {
        console.error('Error fetching players:', err);
        // Fallback to flight.players if available
        players = flight.players || [];
      }

      if (!players || players.length === 0) {
        throw new Error('No players found for this flight.');
      }

      // Create default 18 holes with standard par
      // Standard golf course: Par 72 (4 par-3s, 10 par-4s, 4 par-5s)
      const standardPars = [4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5];
      const holes: any[] = [];
      
      for (let i = 1; i <= 18; i++) {
        holes.push({
          holeNumber: i,
          par: standardPars[i - 1] || 4,
          index: i, // Handicap index, typically 1-18
        });
      }

      // Transform data into ScoreData format
      const playerScores: PlayerScore[] = players.map((player: any, index: number) => {
        // Find scores for this player using flight_player_id
        const playerScoreData = scores.filter((s: any) => 
          s.flight_player_id === player._id || s.player_order === player.player_order
        );
        
        // Transform to HoleScore format
        const holeScores: HoleScore[] = playerScoreData.map((s: any) => ({
          holeNumber: s.hole_number,
          strokes: s.strokes,
          putts: s.putts,
        }));

        // Calculate total score
        const totalScore = holeScores.reduce((sum, hole) => sum + hole.strokes, 0);

        return {
          playerId: player._id || `player-${index}`,
          playerName: player.name || 'Unknown Player',
          scores: holeScores,
          totalScore,
          handicap: player.handicap_index || player.handicap,
          bagTagNumber: player.bag_tag_number,
        };
      });

      return {
        flightId: flight._id,
        flightName: flight.flight_name,
        teeOffTime: flight.tee_off_time,
        startHole: flight.start_hole,
        gameMode: flight.game_mode,
        courseType: flight.course_type,
        scoringSystem: flight.scoring_system,
        players: playerScores,
        holes: holes,
      };
    } catch (error) {
      console.error('Error fetching flight score:', error);
      // Re-throw with more specific error message if available
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch scoring data. Please try again.');
    }
  }

  /**
   * Clear the flights cache (useful for manual refresh)
   */
  clearCache(): void {
    this.flightsCache = null;
  }
}

// Export singleton instance
export const convexService = new ConvexService();
