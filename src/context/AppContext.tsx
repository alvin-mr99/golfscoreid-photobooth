import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Flight, ScoreData, CapturedPhoto } from '../types';

interface AppContextType {
  // Flight state
  selectedFlight: Flight | null;
  setSelectedFlight: (flight: Flight | null) => void;
  
  // Score state
  scoreData: ScoreData | null;
  setScoreData: (data: ScoreData | null) => void;
  
  // Photos state
  capturedPhotos: CapturedPhoto[];
  setCapturedPhotos: (photos: CapturedPhoto[]) => void;
  addPhoto: (photo: CapturedPhoto) => void;
  removePhoto: (photoId: string) => void;
  
  // Selected photos state
  selectedPhotoIds: string[];
  setSelectedPhotoIds: (ids: string[]) => void;
  togglePhotoSelection: (photoId: string) => void;
  
  // Camera stream state
  cameraStream: MediaStream | null;
  setCameraStream: (stream: MediaStream | null) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;
  
  // Reset all state
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add photo to gallery
  const addPhoto = (photo: CapturedPhoto) => {
    setCapturedPhotos(prev => [...prev, photo]);
  };

  // Remove photo from gallery
  const removePhoto = (photoId: string) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
    setSelectedPhotoIds(prev => prev.filter(id => id !== photoId));
  };

  // Toggle photo selection
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else {
        return [...prev, photoId];
      }
    });
  };

  // Reset all state
  const resetState = () => {
    setSelectedFlight(null);
    setScoreData(null);
    setCapturedPhotos([]);
    setSelectedPhotoIds([]);
    
    // Stop camera stream if active
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    setIsLoading(false);
    setError(null);
  };

  const value: AppContextType = {
    selectedFlight,
    setSelectedFlight,
    scoreData,
    setScoreData,
    capturedPhotos,
    setCapturedPhotos,
    addPhoto,
    removePhoto,
    selectedPhotoIds,
    setSelectedPhotoIds,
    togglePhotoSelection,
    cameraStream,
    setCameraStream,
    isLoading,
    setIsLoading,
    error,
    setError,
    resetState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
