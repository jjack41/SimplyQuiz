import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { mediaDB } from '../services/mediaDB';

interface StorageInfo {
  used: number;
  items: number;
}

interface MediaItem {
  id: string;
  type: string;
  metadata: {
    size: number;
    name: string;
    lastModified: number;
  };
}

export function MediaStorage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const loadStorageInfo = async () => {
    try {
      setIsLoading(true);
      const info = await mediaDB.getStorageInfo();
      setStorageInfo(info);
      
      // Charger la liste des médias si on affiche les détails
      if (showDetails) {
        const { items } = await mediaDB.getAllMedia();
        setMediaItems(items);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des informations de stockage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorageInfo();
  }, [showDetails]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Stockage des médias
      </Typography>
      
      {storageInfo && (
        <Box sx={{ mt: 2 }}>
          <Typography>
            Espace utilisé : {formatSize(storageInfo.used)}
          </Typography>
          <Typography>
            Nombre d'éléments : {storageInfo.items}
          </Typography>
          
          <Button
            variant="outlined"
            onClick={() => setShowDetails(!showDetails)}
            sx={{ mt: 2 }}
          >
            {showDetails ? 'Masquer les détails' : 'Afficher les détails'}
          </Button>

          {showDetails && mediaItems.length > 0 && (
            <List sx={{ mt: 2 }}>
              {mediaItems.map((item) => (
                <ListItem key={item.id} divider>
                  <ListItemText
                    primary={`ID: ${item.id}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          Type: {item.type}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Taille: {formatSize(item.metadata.size)}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Dernière modification: {formatDate(item.metadata.lastModified)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}
    </Paper>
  );
}
