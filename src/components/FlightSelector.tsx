import { useState, useMemo } from 'react';
import type { Flight } from '../types';

interface FlightSelectorProps {
  flights: Flight[];
  onSelect: (flightId: string) => void;
  isLoading: boolean;
}

export function FlightSelector({ flights, onSelect, isLoading }: FlightSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter flights based on search query
  const filteredFlights = useMemo(() => {
    if (!searchQuery.trim()) {
      return flights;
    }

    const query = searchQuery.toLowerCase();
    return flights.filter(flight => {
      // Search in flight name
      if (flight.flight_name.toLowerCase().includes(query)) {
        return true;
      }

      // Search in player names
      if (flight.players?.some(player => 
        player.name.toLowerCase().includes(query)
      )) {
        return true;
      }

      // Search in date (formatted)
      const date = new Date(flight.tee_off_time).toLocaleDateString();
      if (date.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [flights, searchQuery]);

  const handleFlightSelect = (flightId: string) => {
    onSelect(flightId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const formatTeeOffTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari flight atau nama pemain..."
          disabled={isLoading}
          className="w-full px-6 py-6 text-2xl border-2 border-gray-300 rounded-2xl 
                   focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100
                   disabled:bg-gray-100 disabled:cursor-not-allowed
                   transition-all duration-200
                   min-h-[60px]"
        />
        
        {/* Search Icon */}
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-green-500"></div>
          <p className="mt-2">Memuat data flights...</p>
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && !isLoading && filteredFlights.length > 0 && (
        <div className="mt-4 bg-white border-2 border-gray-200 rounded-2xl shadow-xl 
                      max-h-[60vh] overflow-y-auto">
          {filteredFlights.map((flight) => (
            <button
              key={flight._id}
              onClick={() => handleFlightSelect(flight._id)}
              className="w-full px-6 py-6 text-left hover:bg-green-50 
                       border-b border-gray-100 last:border-b-0
                       transition-colors duration-150
                       focus:outline-none focus:bg-green-100
                       min-h-[80px] active:bg-green-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    {flight.flight_name}
                  </h3>
                  <p className="text-base text-gray-600 mb-3">
                    Tee Off: {formatTeeOffTime(flight.tee_off_time)}
                  </p>
                  {flight.players && flight.players.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {flight.players.map((player) => (
                        <span
                          key={player._id}
                          className="inline-block px-4 py-2 bg-green-100 text-green-800 
                                   text-base rounded-full"
                        >
                          {player.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Arrow Icon */}
                <div className="ml-4 text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && !isLoading && searchQuery && filteredFlights.length === 0 && (
        <div className="mt-4 p-8 bg-gray-50 border-2 border-gray-200 rounded-2xl text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg">
            Tidak ada flight yang ditemukan untuk "{searchQuery}"
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Coba kata kunci lain atau nama pemain
          </p>
        </div>
      )}

      {/* Initial State - Show all flights */}
      {!isOpen && !isLoading && flights.length > 0 && !searchQuery && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          {flights.length} flight tersedia. Ketik untuk mencari...
        </div>
      )}
    </div>
  );
}
