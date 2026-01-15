import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlightSelector } from '../components';
import { convexService } from '../services/ConvexService';
import type { Flight } from '../types';

const IDLE_TIMEOUT = 60000; // 60 seconds

export function WelcomePage() {
  const navigate = useNavigate();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Load flights from Convex
  const loadFlights = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await convexService.getFlights();
      setFlights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data flights');
      console.error('Error loading flights:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  // Idle timeout - reset to initial state after 60 seconds of inactivity
  useEffect(() => {
    const checkIdle = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > IDLE_TIMEOUT) {
        // Reset state
        setLastActivity(now);
        // Reload flights to get fresh data
        loadFlights();
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [lastActivity, loadFlights]);

  // Track user activity
  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    // Add event listeners for user activity
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [handleActivity]);

  // Handle flight selection
  const handleFlightSelect = (flightId: string) => {
    navigate(`/score-photo/${flightId}`);
  };

  // Handle retry
  const handleRetry = () => {
    loadFlights();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 
                    flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <div className="inline-block p-4 bg-white rounded-full shadow-lg">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          GolfScoreID Photo Booth
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Lihat hasil scoring Anda dan ambil foto untuk dicetak
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-1">
                  Terjadi Kesalahan
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold
                           hover:bg-red-700 transition-colors duration-200
                           focus:outline-none focus:ring-4 focus:ring-red-200"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Flight Selector */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Pilih Flight Anda
          </h2>
          
          <FlightSelector
            flights={flights}
            onSelect={handleFlightSelect}
            isLoading={isLoading}
          />
        </div>

        {/* Instructions */}
        {!isLoading && !error && flights.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">
                Ketik nama flight atau nama pemain untuk mencari
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Sentuh layar untuk memulai</p>
      </div>
    </div>
  );
}
