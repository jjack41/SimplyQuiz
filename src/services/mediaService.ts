export interface MediaFile {
  id: string;
  path: string;
  type: string;
  size: number;
  lastModified: number;
}

class MediaService {
  private readonly MEDIA_PATH = '/media';

  /**
   * Sauvegarde un fichier dans le dossier public/media
   */
  async saveFile(file: File): Promise<MediaFile> {
    try {
      // Générer un nom de fichier unique
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${this.MEDIA_PATH}/${fileName}`;

      // Créer un FormData pour l'upload
      const formData = new FormData();
      formData.append('file', file);

      // Envoyer le fichier au serveur
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de l'upload: ${response.statusText}`);
      }

      // Retourner les informations du fichier
      return {
        id: fileName,
        path: filePath,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du fichier:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL complète d'un fichier média
   */
  getMediaUrl(path: string): string {
    if (!path) return '';
    // S'assurer que le chemin commence par /media
    if (!path.startsWith(this.MEDIA_PATH)) {
      path = `${this.MEDIA_PATH}/${path}`;
    }
    return path;
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

export const mediaService = new MediaService();
