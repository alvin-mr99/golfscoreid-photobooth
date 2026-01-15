import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ScoreDisplay, 
  PhotoBooth, 
  PhotoGallery, 
  PrintButton 
} from '../components';
import { convexService } from '../services/ConvexService';
import type { ScoreData, CapturedPhoto } from '../types';

const POST_PRINT_TIMEOUT = 3000; // 5 seconds

export function ScorePhotoPage() {
  const { flightId } = useParams<{ flightId: string }>();
  const navigate = useNavigate();

  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintSuccess, setShowPrintSuccess] = useState(false);

  // Load score data on mount
  useEffect(() => {
    const loadScoreData = async () => {
      if (!flightId) {
        setError('Invalid Flight ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await convexService.getFlightScore(flightId);
        setScoreData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scoring data');
        console.error('Error loading score data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadScoreData();
  }, [flightId]);

  // Handle photo capture
  const handlePhotoCapture = (photo: CapturedPhoto) => {
    setCapturedPhotos(prev => [...prev, photo]);
    // Auto-select newly captured photo
    setSelectedPhotoIds(prev => [...prev, photo.id]);
  };

  // Handle photo selection toggle
  const handlePhotoSelect = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else {
        return [...prev, photoId];
      }
    });
  };

  // Handle photo deletion
  const handlePhotoDelete = (photoId: string) => {
    setCapturedPhotos(prev => prev.filter(photo => photo.id !== photoId));
    setSelectedPhotoIds(prev => prev.filter(id => id !== photoId));
  };

  // Handle print complete
  const handlePrintComplete = () => {
    setShowPrintSuccess(true);

    // Auto-reset after 5 seconds
    setTimeout(() => {
      handleStartOver();
    }, POST_PRINT_TIMEOUT);
  };

  // Handle start over
  const handleStartOver = () => {
    // Clear all session data
    setCapturedPhotos([]);
    setSelectedPhotoIds([]);
    setSelectedPlayerIds([]);
    setScoreData(null);
    setShowPrintSuccess(false);
    
    // Navigate back to welcome page
    navigate('/');
  };

  // Handle selected players change
  const handleSelectedPlayersChange = (playerIds: string[]) => {
    setSelectedPlayerIds(playerIds);
  };

  // Get selected photos for printing
  const selectedPhotos = capturedPhotos.filter(photo => 
    selectedPhotoIds.includes(photo.id)
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/background-2.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-green-900/40 to-black/50"></div>
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="text-center animate-fade-in">
            <div className="inline-block p-6 bg-white/95 backdrop-blur-xl rounded-full shadow-2xl mb-6 animate-bounce-slow">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
            </div>
            <p className="text-2xl font-semibold text-white drop-shadow-2xl" style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}>
              Loading scoring data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !scoreData) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/background-2.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-red-900/40 to-black/50"></div>
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border-2 border-white/50 animate-fade-in-up">
            <div className="mb-6 animate-shake">
              <div className="inline-block p-4 bg-red-100 rounded-full">
                <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              An Error Occurred
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              {error || 'Failed to load scoring data'}
            </p>
            <button
              onClick={handleStartOver}
              className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg
                       hover:from-green-700 hover:to-emerald-700 hover:scale-105 transition-all duration-300
                       focus:outline-none focus:ring-4 focus:ring-green-300 shadow-xl"
            >
              Back to Welcome
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Print success overlay
  if (showPrintSuccess) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/background-2.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-green-900/40 to-black/50"></div>
        </div>
        
        {/* Animated Confetti Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border-2 border-white/50 animate-scale-in">
            <div className="mb-8 animate-bounce-slow">
              <div className="inline-block p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full shadow-xl">
                <svg className="w-20 h-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Thank You!
            </h2>
            <p className="text-2xl text-gray-700 mb-3 font-semibold">
              Your document is being printed
            </p>
            <p className="text-lg text-gray-500 mb-8">
              Returning to home page in a few seconds...
            </p>
            <div className="mt-8">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full animate-progress shadow-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/background-2.jpg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-green-900/25 to-black/40"></div>
      </div>

      {/* Animated Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-green-400/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header - Optimized for Portrait */}
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-down">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-white/50">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-2xl" style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}>
                Scoring & Photo Booth
              </h1>
            </div>
            <button
              onClick={handleStartOver}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/90 backdrop-blur-xl text-gray-800 rounded-2xl font-bold text-base sm:text-lg
                       hover:bg-white hover:scale-105 transition-all duration-300
                       focus:outline-none focus:ring-4 focus:ring-white/50 shadow-2xl
                       flex items-center justify-center gap-3 border-2 border-white/50"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                      d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Start Over
            </button>
          </div>

          {/* Main Content - Single Column for Portrait */}
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fade-in-up">
            {/* Score Display */}
            <div className="bg-white/15 backdrop-blur-2xl rounded-3xl shadow-2xl p-4 sm:p-6 border-2 border-white/30 hover:border-white/50 transition-all duration-500">
              <ScoreDisplay 
                scoreData={scoreData} 
                onSelectedPlayersChange={handleSelectedPlayersChange}
              />
            </div>

            {/* Photo Booth */}
            <div className="bg-white/15 backdrop-blur-2xl rounded-3xl shadow-2xl p-4 sm:p-6 border-2 border-white/30 hover:border-white/50 transition-all duration-500">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-white/90 rounded-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
                  Take Photo
                </h2>
              </div>
              <PhotoBooth 
                onPhotoCapture={handlePhotoCapture}
                currentPhotoCount={capturedPhotos.length}
              />
            </div>

            {/* Photo Gallery */}
            {capturedPhotos.length > 0 && (
              <div className="bg-white/15 backdrop-blur-2xl rounded-3xl shadow-2xl p-4 sm:p-6 border-2 border-white/30 hover:border-white/50 transition-all duration-500 animate-fade-in">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 bg-white/90 rounded-xl">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
                    Photo Gallery
                  </h2>
                </div>
                <PhotoGallery
                  photos={capturedPhotos}
                  selectedPhotos={selectedPhotoIds}
                  onPhotoSelect={handlePhotoSelect}
                  onPhotoDelete={handlePhotoDelete}
                />
              </div>
            )}

            {/* Print Button */}
            <div className="animate-fade-in">
              <PrintButton
                scoreData={scoreData}
                selectedPhotos={selectedPhotos}
                selectedPlayerIds={selectedPlayerIds}
                onPrintComplete={handlePrintComplete}
              />
            </div>
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
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out 0.2s both; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-shake { animation: shake 0.6s ease-in-out; }
        .animate-scale-in { animation: scale-in 0.5s ease-out; }
        .animate-progress { animation: progress 5s linear; }
      `}</style>
    </div>
  );
}
