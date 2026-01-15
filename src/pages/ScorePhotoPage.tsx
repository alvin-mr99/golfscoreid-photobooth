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

const POST_PRINT_TIMEOUT = 5000; // 5 seconds

export function ScorePhotoPage() {
  const { flightId } = useParams<{ flightId: string }>();
  const navigate = useNavigate();

  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintSuccess, setShowPrintSuccess] = useState(false);

  // Load score data on mount
  useEffect(() => {
    const loadScoreData = async () => {
      if (!flightId) {
        setError('Flight ID tidak valid');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await convexService.getFlightScore(flightId);
        setScoreData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data scoring');
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
    setScoreData(null);
    setShowPrintSuccess(false);
    
    // Navigate back to welcome page
    navigate('/');
  };

  // Get selected photos for printing
  const selectedPhotos = capturedPhotos.filter(photo => 
    selectedPhotoIds.includes(photo.id)
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
          <p className="text-xl text-gray-700">Memuat data scoring...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !scoreData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Gagal memuat data scoring'}
          </p>
          <button
            onClick={handleStartOver}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold
                     hover:bg-green-700 transition-colors duration-200
                     focus:outline-none focus:ring-4 focus:ring-green-200"
          >
            Kembali ke Welcome
          </button>
        </div>
      </div>
    );
  }

  // Print success overlay
  if (showPrintSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
          <div className="mb-6">
            <div className="inline-block p-4 bg-green-100 rounded-full">
              <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Terima Kasih!
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Dokumen Anda sedang dicetak
          </p>
          <p className="text-gray-500">
            Kembali ke halaman awal dalam beberapa detik...
          </p>
          <div className="mt-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            Scoring & Photo Booth
          </h1>
          <button
            onClick={handleStartOver}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold
                     hover:bg-gray-700 transition-colors duration-200
                     focus:outline-none focus:ring-4 focus:ring-gray-300
                     flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Mulai Ulang
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Score Display */}
          <div className="space-y-6">
            <ScoreDisplay scoreData={scoreData} />
          </div>

          {/* Right Column: Photo Booth & Gallery */}
          <div className="space-y-6">
            {/* Photo Booth */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Ambil Foto
              </h2>
              <PhotoBooth onPhotoCapture={handlePhotoCapture} />
            </div>

            {/* Photo Gallery */}
            {capturedPhotos.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Galeri Foto
                </h2>
                <PhotoGallery
                  photos={capturedPhotos}
                  selectedPhotos={selectedPhotoIds}
                  onPhotoSelect={handlePhotoSelect}
                  onPhotoDelete={handlePhotoDelete}
                />
              </div>
            )}

            {/* Print Button */}
            <div>
              <PrintButton
                scoreData={scoreData}
                selectedPhotos={selectedPhotos}
                onPrintComplete={handlePrintComplete}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
