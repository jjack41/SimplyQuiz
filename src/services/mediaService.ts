export interface MediaFile {
  id: string;
  path: string;
  type: string;
  size: number;
  lastModified: number;
}

export class MediaService {
  private static instance: MediaService;
  private constructor() {}

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  /**
   * Sauvegarde un fichier dans le dossier public/media
   */
  async saveFile(file: File): Promise<MediaFile> {
    try {
      console.log('[MediaService] Début de l\'upload du fichier:', {
        nom: file.name,
        taille: file.size,
        type: file.type
      });

      // Générer un nom de fichier unique
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `media/${fileName}`;
      console.log('[MediaService] Nom de fichier généré:', fileName);

      // Créer un FormData pour l'upload
      const formData = new FormData();
      formData.append('file', file);

      // Utiliser un chemin relatif pour l'API
      const apiUrl = new URL('/api/upload', window.location.origin);
      console.log('[MediaService] URL de l\'API:', apiUrl.toString());

      // Envoyer le fichier au serveur
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[MediaService] Erreur serveur:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[MediaService] Fichier uploadé avec succès:', data);

      // Retourner les informations du fichier avec le chemin relatif
      return {
        id: fileName,
        path: filePath,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      };
    } catch (error) {
      console.error('[MediaService] Erreur lors de l\'upload:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL complète d'un fichier média
   */
  getMediaUrl(path: string): string {
    if (!path) return '';
    // Nettoyer le chemin pour s'assurer qu'il est relatif
    const cleanPath = path.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/+/, '');
    // S'assurer que le chemin commence par /media
    if (!cleanPath.startsWith('media/')) {
      return `media/${cleanPath}`;
    }
    return cleanPath;
  }

  /**
   * Supprime un fichier média
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const response = await fetch(`/api/delete-media?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const response = await fetch(this.getMediaUrl(path), {
        method: 'HEAD'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const mediaService = MediaService.getInstance();
