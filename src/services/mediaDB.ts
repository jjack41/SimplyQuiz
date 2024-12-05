export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  blob: Blob;
  metadata: {
    name: string;
    size: number;
    lastModified: number;
    questionId?: string;
    timestamp?: number;
  };
}

class MediaDB {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'SimplyQuizMedia';
  private readonly STORE_NAME = 'media';
  private readonly VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('questionId', 'metadata.questionId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async store(file: File, questionId?: string, fileName?: string): Promise<string> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      // Utiliser le nom de fichier fourni ou en générer un nouveau
      const id = fileName || `${Date.now()}-${file.name}`;
      const type = file.type.split('/')[0] as MediaItem['type'];

      const mediaItem: MediaItem = {
        id,
        type,
        blob: file,
        metadata: {
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          questionId
        }
      };

      const request = store.add(mediaItem);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  async putMediaItem(item: MediaItem): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.put(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get(id: string): Promise<MediaItem | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getByQuestionId(questionId: string): Promise<MediaItem[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('questionId');
      const request = index.getAll(questionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async putPartial(item: Partial<MediaItem>): Promise<string> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      if (!item.id || !item.blob) {
        reject(new Error('ID et blob sont requis'));
        return;
      }

      const mediaItem: MediaItem = {
        id: item.id,
        type: item.type || 'image',
        blob: item.blob,
        metadata: {
          name: item.metadata?.name || 'unnamed',
          size: item.metadata?.size || item.blob.size,
          lastModified: item.metadata?.lastModified || Date.now(),
          questionId: item.metadata?.questionId,
          timestamp: item.metadata?.timestamp
        }
      };

      const request = store.put(mediaItem);

      request.onerror = () => {
        console.error('Erreur lors du stockage dans IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Image stockée avec succès dans IndexedDB:', item.id);
        resolve(item.id ?? '');  
      };

      transaction.onerror = () => {
        console.error('Erreur de transaction IndexedDB:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  async getAllMedia(): Promise<{ total: number; items: MediaItem[] }> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onerror = () => {
        console.error('Erreur lors de la récupération des médias:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const items = request.result;
        console.log(`Total des médias stockés: ${items.length}`);
        items.forEach(item => {
          console.log(`- ID: ${item.id}, Type: ${item.type}, Taille: ${item.metadata.size} bytes`);
        });
        resolve({ total: items.length, items });
      };
    });
  }

  async getStorageInfo(): Promise<{ used: number; items: number }> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = request.result;
        const used = items.reduce((total, item) => total + item.metadata.size, 0);
        resolve({
          used,
          items: items.length
        });
      };
    });
  }
}

export const mediaDB = new MediaDB();
