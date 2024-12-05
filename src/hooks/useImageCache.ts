import { useCallback } from 'react';
import { mediaDB } from '../services/mediaDB';

interface CacheEntry {
  url: string;
  timestamp: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

export const useImageCache = () => {
  const getCachedImage = useCallback(async (imageId: string): Promise<string | null> => {
    try {
      // Essayer d'abord de récupérer l'image depuis IndexedDB
      const cachedImage = await mediaDB.get(imageId);
      if (cachedImage && cachedImage.metadata && cachedImage.metadata.timestamp) {
        const cacheEntry: CacheEntry = {
          url: URL.createObjectURL(cachedImage.blob),
          timestamp: cachedImage.metadata.timestamp
        };
        const isCachedImageValid = Date.now() - cacheEntry.timestamp < CACHE_DURATION;
        if (isCachedImageValid) {
          return cacheEntry.url;
        } else {
          // Si l'image est obsolète, la supprimer de IndexedDB
          await mediaDB.delete(imageId);
        }
      } else if (cachedImage) {
        // Handle the case where timestamp is undefined
        console.error('Timestamp is not defined for cached image:', cachedImage);
      } else {
        console.error('Cached image not found for ID:', imageId);
      }

      // Si l'image n'est pas dans IndexedDB, essayer le serveur local
      try {
        const localResponse = await fetch(`http://localhost:3002/media/${imageId}`);
        if (localResponse.ok) {
          const blob = await localResponse.blob();
          const cacheEntry: CacheEntry = {
            url: URL.createObjectURL(blob),
            timestamp: Date.now()
          };
          // Stocker l'image dans IndexedDB pour les prochaines utilisations
          await mediaDB.putMediaItem({
            id: imageId,
            type: 'image',
            blob,
            metadata: {
              name: imageId,
              size: blob.size,
              lastModified: cacheEntry.timestamp
            }
          });
          return cacheEntry.url;
        }
      } catch (localError) {
        console.error('Erreur lors de la récupération depuis le serveur local:', localError);
      }

      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'image:', error);
      return null;
    }
  }, []);

  const preloadImages = useCallback(async (imageIds: string[]) => {
    const promises = imageIds.map(id => getCachedImage(id));
    await Promise.all(promises);
  }, [getCachedImage]);

  return { getCachedImage, preloadImages };
};
