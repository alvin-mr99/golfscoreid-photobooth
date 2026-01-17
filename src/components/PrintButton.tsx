import { useState } from 'react';
import { printService } from '../services/PrintService';
import type { ScoreData, CapturedPhoto } from '../types';

interface PrintButtonProps {
  scoreData: ScoreData;
  selectedPhotos: CapturedPhoto[];
  selectedPlayerIds?: string[];
  onPrintComplete: () => void;
  disabled?: boolean;
}

const MAX_PHOTOS_FOR_PRINT = 3;

export function PrintButton({ 
  scoreData, 
  selectedPhotos,
  selectedPlayerIds,
  onPrintComplete,
  disabled = false 
}: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string>('');

  const handleShowPreview = async () => {
    try {
      setIsLoadingPreview(true);
      setError(null);
      setShowPreview(true);

      // Limit to maximum 3 photos
      const photosToPreview = selectedPhotos.slice(0, MAX_PHOTOS_FOR_PRINT);

      // Generate preview HTML with selected players and limited photos
      const html = await printService.generatePreviewHTML(scoreData, photosToPreview, selectedPlayerIds);
      setPreviewHTML(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
      console.error('Preview error:', err);
      setShowPreview(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      setError(null);

      // Limit to maximum 3 photos
      const photosToPrint = selectedPhotos.slice(0, MAX_PHOTOS_FOR_PRINT);

      // Print score and photos with selected players and limited photos
      await printService.printScoreAndPhotos(scoreData, photosToPrint, selectedPlayerIds);

      // Close preview and notify parent
      setShowPreview(false);
      onPrintComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print');
      console.error('Print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleClosePreview = () => {
    if (!isPrinting) {
      setShowPreview(false);
      setPreviewHTML('');
    }
  };

  const handleRetry = () => {
    setError(null);
    handleShowPreview();
  };

  return (
    <div>
      {/* Print Button */}
      <button
        onClick={handleShowPreview}
        disabled={disabled || isPrinting}
        className="w-full py-5 bg-blue-600 text-white rounded-xl font-bold text-xl
                 hover:bg-blue-700 active:bg-blue-800
                 disabled:bg-gray-400 disabled:cursor-not-allowed
                 transition-colors duration-200
                 focus:outline-none focus:ring-4 focus:ring-blue-300
                 flex items-center justify-center gap-3"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Scoring & Photos
        {selectedPhotos.length > 0 && (
          <span className="px-3 py-1 bg-blue-500 rounded-full text-sm">
            {Math.min(selectedPhotos.length, MAX_PHOTOS_FOR_PRINT)} photos
          </span>
        )}
      </button>

      {/* Info Text */}
      {!disabled && !error && (
        <p className="mt-3 text-center text-sm text-white">
          {selectedPhotos.length === 0 
            ? 'Select photos to print with scoring' 
            : `${Math.min(selectedPhotos.length, MAX_PHOTOS_FOR_PRINT)} photos will be printed${selectedPhotos.length > MAX_PHOTOS_FOR_PRINT ? ` (max ${MAX_PHOTOS_FOR_PRINT})` : ''}`}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-1">Print Failed</p>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold
                         hover:bg-red-700 transition-colors duration-200
                         focus:outline-none focus:ring-4 focus:ring-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Print Preview</h2>
              </div>
              <button
                onClick={handleClosePreview}
                disabled={isPrinting}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200
                         focus:outline-none focus:ring-4 focus:ring-gray-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Preview Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="relative mb-6">
                    {/* Animated Spinner */}
                    <div className="w-20 h-20 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    {/* Pulsing Circle */}
                    <div className="absolute inset-0 w-20 h-20 border-8 border-blue-300 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <p className="text-xl font-semibold text-gray-700 mb-2">Generating Preview...</p>
                  <p className="text-sm text-gray-500">Please wait while we prepare your document</p>
                  
                  {/* Loading Progress Bar */}
                  <div className="mt-6 w-64">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-loading-bar"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
                  <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
                </div>
              )}
            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="p-6 border-t border-gray-200 bg-white rounded-b-3xl">
              <div className="flex gap-4">
                <button
                  onClick={handleClosePreview}
                  disabled={isPrinting}
                  className="flex-1 px-6 py-4 bg-gray-200 text-gray-800 rounded-xl font-bold text-lg
                           hover:bg-gray-300 transition-colors duration-200
                           focus:outline-none focus:ring-4 focus:ring-gray-300
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  onClick={handlePrint}
                  disabled={isPrinting || isLoadingPreview}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg
                           hover:from-blue-700 hover:to-blue-800 hover:scale-105 transition-all duration-300
                           focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-xl
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           flex items-center justify-center gap-3"
                >
                  {isPrinting ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent"></div>
                      Printing...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-loading-bar { animation: loading-bar 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
