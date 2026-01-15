/**
 * CameraService handles camera access and photo capture using MediaDevices API
 */
class CameraService {
  /**
   * Request camera access and return MediaStream
   * @throws Error if camera access is denied or not available
   */
  async requestCameraAccess(): Promise<MediaStream> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser');
      }

      // Request video stream with optimal settings for photo booth
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment', // Back-facing camera (landscape mode)
        },
        audio: false,
      });

      return stream;
    } catch (error) {
      console.error('Camera access error:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('Camera access denied. Please allow camera permissions in your browser settings.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('No camera found. Please connect a camera and try again.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          throw new Error('Camera is already in use by another application.');
        }
      }
      
      throw new Error('Failed to access camera. Please check your camera connection.');
    }
  }

  /**
   * Capture a photo from the video element
   * @param videoElement The video element displaying the camera stream
   * @returns Base64 encoded image data URL
   */
  capturePhoto(videoElement: HTMLVideoElement): string {
    try {
      // Create canvas with video dimensions
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw current video frame to canvas
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Draw image in landscape mode (no rotation)
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL (JPEG format for smaller file size)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      return dataUrl;
    } catch (error) {
      console.error('Photo capture error:', error);
      throw new Error('Failed to capture photo. Please try again.');
    }
  }

  /**
   * Stop the camera stream and release resources
   * @param stream The MediaStream to stop
   */
  stopCamera(stream: MediaStream): void {
    try {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  }

  /**
   * Check if camera is available
   * @returns Promise<boolean> indicating camera availability
   */
  async isCameraAvailable(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return false;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cameraService = new CameraService();
