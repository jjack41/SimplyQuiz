import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, Paper, CircularProgress } from '@mui/material';
import { Delete as DeleteIcon, CloudUpload as CloudUploadIcon, AddPhotoAlternate as AddPhotoIcon } from '@mui/icons-material';
import { mediaDB } from '../services/mediaDB';
import { styled, useTheme } from '@mui/material/styles';

interface ImageSelectorProps {
  questionId: string;
  currentImage: string | null;
  onImageChange: (url: string | null) => void;
}

const DropZone = styled(Paper)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    borderColor: theme.palette.primary.dark,
    backgroundColor: theme.palette.action.hover,
  },
}));

const ImagePreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 400,
  margin: '0 auto',
  marginTop: theme.spacing(2),
  '& img': {
    width: '100%',
    height: 'auto',
    maxHeight: '200px',
    objectFit: 'contain',
    borderRadius: theme.shape.borderRadius,
    transition: 'transform 0.3s ease',
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  '&:hover': {
    '& img': {
      transform: 'scale(1.02)',
    },
  },
}));

export default function ImageSelector({ questionId, currentImage, onImageChange }: ImageSelectorProps) {
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [displayedImage, setDisplayedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadImage = async () => {
      setImageError(false);
      if (currentImage) {
        try {
          const mediaItem = await mediaDB.get(currentImage);
          if (mediaItem) {
            const imageUrl = URL.createObjectURL(mediaItem.blob);
            setDisplayedImage(imageUrl);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'image:', error);
          setImageError(true);
          setDisplayedImage(null);
        }
      } else {
        setDisplayedImage(null);
      }
    };

    loadImage();
  }, [currentImage]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    try {
      setUploading(true);
      setImageError(false);

      if (localImageUrl) {
        URL.revokeObjectURL(localImageUrl);
      }
      const newLocalUrl = URL.createObjectURL(file);
      setLocalImageUrl(newLocalUrl);

      // Si une image existe déjà, la supprimer
      if (currentImage) {
        const oldFileName = currentImage.split('/').pop();
        if (oldFileName) {
          try {
            await mediaDB.delete(oldFileName);
            await fetch(`/api/delete-media?path=${oldFileName}`, {
              method: 'DELETE',
              credentials: 'include'
            });
          } catch (error) {
            console.error('Erreur lors de la suppression de l\'ancienne image:', error);
          }
        }
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('[ImageSelector] Début upload fichier:', {
        nom: file.name,
        taille: file.size,
        type: file.type
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ImageSelector] Erreur serveur:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[ImageSelector] Réponse serveur:', data);
      
      const fileName = data.path.split('/').pop();
      console.log('[ImageSelector] Nom du fichier extrait:', fileName);
      
      // Stocker dans IndexedDB avec le nom du fichier uniquement
      const mediaId = await mediaDB.store(file, questionId, fileName);
      
      const mediaItem = await mediaDB.get(mediaId);
      if (mediaItem) {
        const imageUrl = URL.createObjectURL(mediaItem.blob);
        setDisplayedImage(imageUrl);
        // Retourner le chemin relatif
        onImageChange(`media/${fileName}`);
      }

      setLocalImageUrl(null);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload de l\'image');
      setImageError(true);
      setLocalImageUrl(null);
      setDisplayedImage(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentImage) return;

    try {
      await mediaDB.delete(currentImage);

      // Extraire le nom du fichier du chemin relatif
      const fileName = currentImage.split('/').pop();
      if (fileName) {
        console.log('[ImageSelector] Suppression du fichier:', fileName);
        await fetch(`/api/delete-media?path=${fileName}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      }

      onImageChange(null);
      setLocalImageUrl(null);
      setDisplayedImage(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'image');
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '200px' }}>
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <DropZone
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          border: dragActive ? `3px dashed ${theme.palette.primary.main}` : `2px dashed ${theme.palette.primary.light}`,
        }}
      >
        {!displayedImage && !localImageUrl && !uploading && !imageError ? (
          <>
            <CloudUploadIcon 
              sx={{ 
                fontSize: 60, 
                color: dragActive ? 'primary.main' : 'text.secondary',
                mb: 2 
              }} 
            />
            <Typography variant="body1" color="text.secondary">
              Glissez et déposez une image ou cliquez pour sélectionner
            </Typography>
          </>
        ) : (
          displayedImage || localImageUrl ? (
            <ImagePreview>
              <img 
                src={localImageUrl || displayedImage || ''} 
                alt="Uploaded preview" 
              />
              <IconButton 
                color="error" 
                sx={{ position: 'absolute', top: 0, right: 0 }} 
                onClick={handleDelete}
              >
                <DeleteIcon />
              </IconButton>
            </ImagePreview>
          ) : (
            uploading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <AddPhotoIcon sx={{ fontSize: 48, color: imageError ? 'error.main' : 'primary.main', mb: 1 }} />
                <Typography color={imageError ? 'error' : 'inherit'}>
                  {imageError ? 'Erreur de chargement - Cliquez pour réessayer' : 'Glissez une image ici ou cliquez pour sélectionner'}
                </Typography>
              </>
            )
          )
        )}
      </DropZone>
    </Box>
  );
}