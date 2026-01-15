/**
 * Generated API for Convex
 * This provides the API object for querying the existing Convex backend
 */

export const api = {
  flights: {
    getAllWithPlayers: { type: 'query', name: 'flights:getAllWithPlayers' },
  },
  tablet_scores: {
    getByFlight: { type: 'query', name: 'tablet_scores:getByFlight' },
  },
  flight_players: {
    getByFlight: { type: 'query', name: 'flight_players:getByFlight' },
  },
};
