import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { cameraService } from '../services/CameraService';
import type { CapturedPhoto } from '../types';

interface PhotoBoothProps {
  onPhotoCapture: (photo: CapturedPhoto) => void;
}

export function PhotoBooth({ onPhotoCapture }: PhotoBoothProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Request camera access on mount
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        setError(null);
        const mediaStream = await cameraService.requestCameraAccess();
        
        if (!mounted) {
          cameraService.stopCamera(mediaStream);
          return;
        }

        setStream(mediaStream);
        
        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to access camera');
          console.error('Camera error:', err);
        }
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (stream) {
        cameraService.stopCamera(stream);
      }
    };
  }, []);

  // Handle photo capture
  const handleCapture = () => {
    if (!videoRef.current || !isCameraReady) {
      return;
    }

    try {
      setIsCapturing(true);
      
      // Capture photo from video
      const dataUrl = cameraService.capturePhoto(videoRef.current);
      
      // Create photo object
      const photo: CapturedPhoto = {
        id: uuidv4(),
        dataUrl,
        timestamp: Date.now(),
      };

      // Notify parent
      onPhotoCapture(photo);

      // Visual feedback
      setTimeout(() => {
        setIsCapturing(false);
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
      setIsCapturing(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    window.location.reload();
  };

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-xl font-semibold text-red-800 mb-2">
          Camera Not Available
        </h3>
        <p className="text-red-700 mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold
                   hover:bg-red-700 transition-colors duration-200
                   focus:outline-none focus:ring-4 focus:ring-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
      {/* Video Preview */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCapturing ? 'opacity-50' : ''}`}
        />
        
        {/* Loading Overlay */}
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
              <p className="text-lg">Loading camera...</p>
            </div>
          </div>
        )}

        {/* Capture Flash Effect */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white animate-pulse"></div>
        )}

        {/* Camera Frame Overlay */}
        {isCameraReady && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-white opacity-50"></div>
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-white opacity-50"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-white opacity-50"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-white opacity-50"></div>
          </div>
        )}
      </div>

      {/* Capture Button */}
      <div className="p-6 bg-gray-800">
        <button
          onClick={handleCapture}
          disabled={!isCameraReady || isCapturing}
          className="w-full py-5 bg-green-600 text-white rounded-xl font-bold text-xl
                   hover:bg-green-700 active:bg-green-800
                   disabled:bg-gray-600 disabled:cursor-not-allowed
                   transition-colors duration-200
                   focus:outline-none focus:ring-4 focus:ring-green-300
                   flex items-center justify-center gap-3"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {isCapturing ? 'Capturing Photo...' : 'Take Photo'}
        </button>
      </div>
    </div>
  );
}
