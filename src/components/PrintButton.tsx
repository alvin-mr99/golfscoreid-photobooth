import { useState } from 'react';
import { printService } from '../services/PrintService';
import type { ScoreData, CapturedPhoto } from '../types';

interface PrintButtonProps {
  scoreData: ScoreData;
  selectedPhotos: CapturedPhoto[];
  onPrintComplete: () => void;
  disabled?: boolean;
}

export function PrintButton({ 
  scoreData, 
  selectedPhotos, 
  onPrintComplete,
  disabled = false 
}: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      setError(null);

      // Print score and photos
      await printService.printScoreAndPhotos(scoreData, selectedPhotos);

      // Notify parent component
      onPrintComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print');
      console.error('Print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handlePrint();
  };

  return (
    <div>
      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={disabled || isPrinting}
        className="w-full py-5 bg-blue-600 text-white rounded-xl font-bold text-xl
                 hover:bg-blue-700 active:bg-blue-800
                 disabled:bg-gray-400 disabled:cursor-not-allowed
                 transition-colors duration-200
                 focus:outline-none focus:ring-4 focus:ring-blue-300
                 flex items-center justify-center gap-3"
      >
        {isPrinting ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent"></div>
            Printing...
          </>
        ) : (
          <>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Scoring & Photos
            {selectedPhotos.length > 0 && (
              <span className="px-3 py-1 bg-blue-500 rounded-full text-sm">
                {selectedPhotos.length} photos
              </span>
            )}
          </>
        )}
      </button>

      {/* Info Text */}
      {!disabled && !error && (
        <p className="mt-3 text-center text-sm text-white">
          {selectedPhotos.length === 0 
            ? 'Select photos to print with scoring' 
            : `${selectedPhotos.length} photos will be printed`}
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
    </div>
  );
}
