import { useState } from 'react';
import type { CapturedPhoto } from '../types';

const MAX_PHOTOS = 3;

interface PhotoGalleryProps {
  photos: CapturedPhoto[];
  selectedPhotos: string[];
  onPhotoSelect: (photoId: string) => void;
  onPhotoDelete: (photoId: string) => void;
}

export function PhotoGallery({ 
  photos, 
  selectedPhotos, 
  onPhotoSelect, 
  onPhotoDelete 
}: PhotoGalleryProps) {
  const [previewPhoto, setPreviewPhoto] = useState<CapturedPhoto | null>(null);

  const isSelected = (photoId: string) => selectedPhotos.includes(photoId);

  const handleThumbnailClick = (photo: CapturedPhoto) => {
    setPreviewPhoto(photo);
  };

  const handleClosePreview = () => {
    setPreviewPhoto(null);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (photos.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
        <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-600 text-lg">
          No photos taken yet
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Use the camera above to take photos
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Gallery Grid - Limited to 3 photos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.slice(0, MAX_PHOTOS).map((photo) => (
          <div
            key={photo.id}
            className={`relative group rounded-xl overflow-hidden border-4 transition-all duration-200
                      ${isSelected(photo.id) 
                        ? 'border-green-500 shadow-lg shadow-green-200' 
                        : 'border-gray-200 hover:border-gray-300'}`}
          >
            {/* Thumbnail */}
            <button
              onClick={() => handleThumbnailClick(photo)}
              className="w-full aspect-square overflow-hidden bg-gray-100 focus:outline-none"
            >
              <img
                src={photo.dataUrl}
                alt={`Photo ${formatTime(photo.timestamp)}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </button>

            {/* Selection Checkbox */}
            <button
              onClick={() => onPhotoSelect(photo.id)}
              className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white shadow-lg
                       flex items-center justify-center
                       focus:outline-none focus:ring-4 focus:ring-green-300
                       transition-all duration-200"
            >
              {isSelected(photo.id) ? (
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
              )}
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onPhotoDelete(photo.id)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white shadow-lg
                       flex items-center justify-center
                       hover:bg-red-700 active:bg-red-800
                       focus:outline-none focus:ring-4 focus:ring-red-300
                       transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Timestamp */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2">
              {formatTime(photo.timestamp)}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Count */}
      <div className="mt-4 text-center text-white">
        <p className="text-sm">
          {photos.length} / {MAX_PHOTOS} photos taken • {selectedPhotos.length} photos selected for printing
        </p>
      </div>

      {/* Full Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={handleClosePreview}
        >
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={handleClosePreview}
              className="absolute -top-12 right-0 text-white hover:text-gray-300
                       focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50
                       rounded-full p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Preview Image */}
            <img
              src={previewPhoto.dataUrl}
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Action Buttons */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4"
                 onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  onPhotoSelect(previewPhoto.id);
                  handleClosePreview();
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold
                         hover:bg-green-700 transition-colors duration-200
                         focus:outline-none focus:ring-4 focus:ring-green-300
                         flex items-center gap-2"
              >
                {isSelected(previewPhoto.id) ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Selected
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M5 13l4 4L19 7" />
                    </svg>
                    Select Photo
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onPhotoDelete(previewPhoto.id);
                  handleClosePreview();
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold
                         hover:bg-red-700 transition-colors duration-200
                         focus:outline-none focus:ring-4 focus:ring-red-300
                         flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
