import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Hands } from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { cameraService } from '../services/CameraService';
import type { CapturedPhoto } from '../types';

const MAX_PHOTOS = 3;

interface PhotoBoothProps {
  onPhotoCapture: (photo: CapturedPhoto) => void;
  currentPhotoCount: number;
}

export function PhotoBooth({ onPhotoCapture, currentPhotoCount }: PhotoBoothProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showMaxPhotosModal, setShowMaxPhotosModal] = useState(false);
  const [gestureDetected, setGestureDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraUtilsRef = useRef<Camera | null>(null);
  const lastGestureTimeRef = useRef<number>(0);
  const isCameraReadyRef = useRef<boolean>(false);

  // Count extended fingers
  const countExtendedFingers = (landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) return 0;

    let count = 0;

    // Thumb - check if tip is far from palm
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const palmBase = landmarks[0];
    
    // Calculate distance for thumb
    const thumbDist = Math.sqrt(
      Math.pow(thumbTip.x - palmBase.x, 2) + 
      Math.pow(thumbTip.y - palmBase.y, 2)
    );
    const thumbBaseDist = Math.sqrt(
      Math.pow(thumbBase.x - palmBase.x, 2) + 
      Math.pow(thumbBase.y - palmBase.y, 2)
    );
    
    if (thumbDist > thumbBaseDist * 1.3) {
      count++;
    }

    // Other fingers - check if tip is above middle joint
    const fingers = [
      { tip: 8, pip: 6, mcp: 5 },   // Index
      { tip: 12, pip: 10, mcp: 9 },  // Middle
      { tip: 16, pip: 14, mcp: 13 }, // Ring
      { tip: 20, pip: 18, mcp: 17 }  // Pinky
    ];

    for (const finger of fingers) {
      const tip = landmarks[finger.tip];
      const pip = landmarks[finger.pip];
      const mcp = landmarks[finger.mcp];
      
      // Check if finger is extended (tip is above pip and pip is above mcp)
      if (tip.y < pip.y && pip.y < mcp.y) {
        count++;
      }
    }

    return count;
  };

  // Handle hand gesture detection results
  const onHandResults = (results: Results) => {
    if (!canvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    // Clear canvas
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Check for 5 fingers gesture
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const fingerCount = countExtendedFingers(landmarks);

      // Draw hand landmarks with connections
      canvasCtx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      canvasCtx.lineWidth = 2;
      canvasCtx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      
      // Draw connections
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17] // Palm
      ];
      
      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        canvasCtx.beginPath();
        canvasCtx.moveTo(
          startPoint.x * canvasRef.current!.width,
          startPoint.y * canvasRef.current!.height
        );
        canvasCtx.lineTo(
          endPoint.x * canvasRef.current!.width,
          endPoint.y * canvasRef.current!.height
        );
        canvasCtx.stroke();
      });
      
      // Draw landmarks
      landmarks.forEach((landmark: any, index: number) => {
        canvasCtx.beginPath();
        canvasCtx.arc(
          landmark.x * canvasRef.current!.width,
          landmark.y * canvasRef.current!.height,
          index === 0 ? 8 : 5, // Larger circle for wrist
          0,
          2 * Math.PI
        );
        canvasCtx.fill();
      });

      // Show finger count for debugging
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      canvasCtx.font = 'bold 24px Arial';
      canvasCtx.fillText(
        `Fingers: ${fingerCount}`,
        20,
        40
      );

      // Detect 5 fingers gesture
      if (fingerCount === 5) {
        const now = Date.now();
        // Prevent multiple triggers (cooldown of 3 seconds)
        if (now - lastGestureTimeRef.current > 3000 && !isCapturing && countdown === null) {
          console.log('5 fingers detected! Starting countdown...');
          setGestureDetected(true);
          lastGestureTimeRef.current = now;
          
          // Start countdown
          startCountdown();
        }
      } else {
        setGestureDetected(false);
      }
    } else {
      setGestureDetected(false);
    }
  };

  // Handle photo capture
  const handleCapture = () => {
    console.log('handleCapture called', { 
      isCameraReady, 
      isCameraReadyRef: isCameraReadyRef.current,
      hasVideo: !!videoRef.current,
      currentPhotoCount, 
      MAX_PHOTOS 
    });
    
    if (!videoRef.current) {
      console.log('Video element not available');
      return;
    }

    // Check if max photos reached
    if (currentPhotoCount >= MAX_PHOTOS) {
      console.log('Max photos reached');
      setShowMaxPhotosModal(true);
      return;
    }

    try {
      setIsCapturing(true);
      console.log('Capturing photo from video element...');
      
      // Create a temporary canvas to capture the photo
      if (!captureCanvasRef.current) {
        captureCanvasRef.current = document.createElement('canvas');
      }
      
      const canvas = captureCanvasRef.current;
      const video = videoRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      
      console.log('Canvas size:', canvas.width, 'x', canvas.height);
      console.log('Video size:', video.videoWidth, 'x', video.videoHeight);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      console.log('Photo captured, dataUrl length:', dataUrl.length);
      
      // Create photo object
      const photo: CapturedPhoto = {
        id: uuidv4(),
        dataUrl,
        timestamp: Date.now(),
      };

      console.log('Calling onPhotoCapture with photo:', photo.id);
      // Notify parent
      onPhotoCapture(photo);

      // Visual feedback
      setTimeout(() => {
        setIsCapturing(false);
      }, 200);
    } catch (err) {
      console.error('Capture error:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
      setIsCapturing(false);
    }
  };

  // Start countdown before capture
  const startCountdown = () => {
    console.log('Starting countdown...');
    setCountdown(3);
    let currentCount = 3;
    
    const countdownInterval = setInterval(() => {
      currentCount--;
      console.log('Countdown:', currentCount);
      
      if (currentCount <= 0) {
        clearInterval(countdownInterval);
        setCountdown(null);
        
        // Trigger capture after countdown
        console.log('Countdown finished, triggering capture');
        setTimeout(() => {
          handleCapture();
        }, 100);
      } else {
        setCountdown(currentCount);
      }
    }, 1000);
  };

  // Initialize MediaPipe Hands
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
            console.log('Camera ready');
            setIsCameraReady(true);
            isCameraReadyRef.current = true;
            
            // Initialize MediaPipe Hands
            const hands = new Hands({
              locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
              }
            });

            hands.setOptions({
              maxNumHands: 1,
              modelComplexity: 1,
              minDetectionConfidence: 0.5,
              minTrackingConfidence: 0.5
            });

            hands.onResults(onHandResults);
            handsRef.current = hands;

            // Start camera processing
            if (videoRef.current) {
              const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                  if (videoRef.current && handsRef.current) {
                    await handsRef.current.send({ image: videoRef.current });
                  }
                },
                width: 1280,
                height: 720
              });
              camera.start();
              cameraUtilsRef.current = camera;
              console.log('MediaPipe Hands initialized');
            }
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
      if (cameraUtilsRef.current) {
        cameraUtilsRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, []);



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

  const isMaxPhotosReached = currentPhotoCount >= MAX_PHOTOS;

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
      {/* Max Photos Modal */}
      {showMaxPhotosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
             onClick={() => setShowMaxPhotosModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in"
               onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              {/* Icon */}
              <div className="mb-6 animate-bounce-slow">
                <div className="inline-block p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full">
                  <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Maximum Photos Reached
              </h3>

              {/* Message */}
              <p className="text-gray-600 text-lg mb-2">
                You can only take up to <span className="font-bold text-orange-600">{MAX_PHOTOS} photos</span>
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Please delete an existing photo if you want to take a new one
              </p>

              {/* Close Button */}
              <button
                onClick={() => setShowMaxPhotosModal(false)}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold text-lg
                         hover:from-orange-700 hover:to-red-700 hover:scale-105 transition-all duration-300
                         focus:outline-none focus:ring-4 focus:ring-orange-300 shadow-xl"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCapturing ? 'opacity-50' : ''}`}
        />
        
        {/* Canvas for hand detection overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          width={1280}
          height={720}
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

        {/* Gesture Detection Indicator */}
        {gestureDetected && countdown === null && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg animate-pulse">
            ✋ 5 Fingers Detected!
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-9xl font-bold animate-bounce-slow">
              {countdown}
            </div>
          </div>
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

        {/* Gesture Instruction */}
        {isCameraReady && !isCapturing && countdown === null && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-6 py-3 rounded-full text-sm">
            ✋ Show 5 fingers to take photo
          </div>
        )}
      </div>

      {/* Capture Button */}
      <div className="p-6 bg-gray-800">
        <button
          onClick={handleCapture}
          disabled={!isCameraReady || isCapturing}
          className={`w-full py-5 text-white rounded-xl font-bold text-xl
                   transition-colors duration-200
                   focus:outline-none focus:ring-4
                   flex items-center justify-center gap-3
                   ${isMaxPhotosReached 
                     ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-300' 
                     : 'bg-green-600 hover:bg-green-700 active:bg-green-800 focus:ring-green-300'}
                   disabled:bg-gray-600 disabled:cursor-not-allowed`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {isCapturing ? 'Capturing Photo...' : isMaxPhotosReached ? `Maximum ${MAX_PHOTOS} Photos` : 'Take Photo'}
        </button>
        {isMaxPhotosReached && (
          <p className="mt-2 text-center text-orange-400 text-sm">
            Delete a photo to take a new one
          </p>
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
