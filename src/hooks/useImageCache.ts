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
      // Nettoyer l'ID de l'image pour obtenir le nom du fichier
      const fileName = imageId.split('/').pop() || imageId;
      console.log('[ImageCache] Récupération de l\'image:', fileName);

      // Essayer d'abord de récupérer l'image depuis IndexedDB
      const cachedImage = await mediaDB.get(fileName);
      if (cachedImage && cachedImage.metadata && cachedImage.metadata.timestamp) {
        console.log('[ImageCache] Image trouvée dans IndexedDB');
        const cacheEntry: CacheEntry = {
          url: URL.createObjectURL(cachedImage.blob),
          timestamp: cachedImage.metadata.timestamp
        };
        const isCachedImageValid = Date.now() - cacheEntry.timestamp < CACHE_DURATION;
        if (isCachedImageValid) {
          return cacheEntry.url;
        } else {
          console.log('[ImageCache] Cache expiré, suppression');
          await mediaDB.delete(fileName);
        }
      }

      // Si l'image n'est pas dans IndexedDB, essayer le serveur
      try {
        console.log('[ImageCache] Récupération depuis le serveur');
        // Nettoyer le chemin pour éviter le double 'media/'
        const cleanFileName = fileName.replace(/^media\//, '');
        const response = await fetch(`/media/${cleanFileName}`);
        if (response.ok) {
          const blob = await response.blob();
          const cacheEntry: CacheEntry = {
            url: URL.createObjectURL(blob),
            timestamp: Date.now()
          };
          
          console.log('[ImageCache] Image récupérée, mise en cache');
          // Stocker l'image dans IndexedDB pour les prochaines utilisations
          await mediaDB.putMediaItem({
            id: fileName,
            type: 'image',
            blob,
            metadata: {
              name: fileName,
              size: blob.size,
              lastModified: cacheEntry.timestamp,
              timestamp: cacheEntry.timestamp
            }
          });

          return cacheEntry.url;
        } else {
          console.error('[ImageCache] Erreur serveur:', response.status, response.statusText);
          return null;
        }
      } catch (error) {
        console.error('[ImageCache] Erreur réseau:', error);
        return null;
      }
    } catch (error) {
      console.error('[ImageCache] Erreur générale:', error);
      return null;
    }
  }, []);

  const preloadImages = useCallback(async (imageIds: string[]) => {
    console.log('[ImageCache] Préchargement des images:', imageIds);
    return Promise.all(imageIds.map(id => getCachedImage(id)));
  }, [getCachedImage]);

  return { getCachedImage, preloadImages };
};
