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
      setError(err instanceof Error ? err.message : 'Failed to load flights data');
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Subtle Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/background.jpg)' }}
      >
        {/* Reduced opacity overlay for better background visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-green-900/30 to-black/40"></div>
      </div>

      {/* Animated Floating Elements - More Subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-green-400/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Header with Animation */}
        <div className="text-center mb-16 animate-fade-in-down">
          <div className="mb-10 animate-bounce-slow">
            <div className="inline-block p-8 bg-white/95 backdrop-blur-xl rounded-full shadow-2xl border-4 border-green-400/50 hover:scale-110 hover:border-green-400 transition-all duration-500">
              <img 
                src="/logo-app.png" 
                alt="GolfScoreID Logo" 
                className="w-28 h-28 object-contain drop-shadow-lg scale-150"
              />
            </div>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-bold mb-6 tracking-tight">
            <span className="inline-block px-6 py-3 bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent animate-gradient drop-shadow-2xl" style={{ textShadow: '0 0 40px rgba(74, 222, 128, 0.3)' }}>
              GolfScoreID
            </span>
            <br />
            <span className="text-6xl md:text-7xl text-white drop-shadow-2xl" style={{ textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.2)' }}>
              Photo Booth
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-white font-medium max-w-3xl mx-auto drop-shadow-2xl" style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)' }}>
            View your scoring results and take photos to print
          </p>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-5xl animate-fade-in-up">
          {/* Error State */}
          {error && (
            <div className="mb-8 p-8 bg-red-500/90 backdrop-blur-xl border-2 border-red-300 rounded-3xl shadow-2xl animate-shake">
              <div className="flex items-start gap-4">
                <svg className="w-8 h-8 text-white flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                    An Error Occurred
                  </h3>
                  <p className="text-white/95 text-lg mb-6 drop-shadow">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-8 py-4 bg-white text-red-600 rounded-xl font-bold text-lg
                             hover:bg-red-50 hover:scale-105 transition-all duration-300
                             focus:outline-none focus:ring-4 focus:ring-white/50 shadow-xl"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Flight Selector Card */}
          <div className="bg-white/15 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 md:p-12 border-2 border-white/30 hover:border-white/50 transition-all duration-500 hover:shadow-green-400/20">
            <h2 className="text-4xl font-bold text-white mb-10 text-center drop-shadow-2xl" style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}>
              Select Your Flight
            </h2>
            
            <FlightSelector
              flights={flights}
              onSelect={handleFlightSelect}
              isLoading={isLoading}
            />
          </div>

          {/* Instructions */}
          {!isLoading && !error && flights.length > 0 && (
            <div className="mt-10 text-center animate-fade-in">
              <div className="inline-flex items-center gap-4 px-10 py-5 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border-2 border-white/50 hover:bg-white transition-all duration-300 hover:scale-105">
                <svg className="w-7 h-7 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-800 font-semibold text-lg">
                  Type flight name or player name to search
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center animate-fade-in">
          <div className="inline-block px-8 py-4 bg-white/10 backdrop-blur-md rounded-full border border-white/30">
            <p className="text-white text-xl font-medium animate-pulse-slow drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)' }}>
              👆 Touch the screen to begin
            </p>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(-30px) translateX(20px) scale(1.1); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(30px) translateX(-20px) scale(1.1); }
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
        .animate-fade-in-down { animation: fade-in-down 1s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out 0.3s both; }
        .animate-fade-in { animation: fade-in 1.2s ease-out 0.5s both; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
        .animate-shake { animation: shake 0.6s ease-in-out; }
      `}</style>
    </div>
  );
}
