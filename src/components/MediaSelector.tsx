import { useState, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

interface MediaSelectorProps {
  type: 'image' | 'video';
  onFileSelect: (file: File | null) => void;
}

export default function MediaSelector({ type, onFileSelect }: MediaSelectorProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    const isCorrectType = type === 'image' 
      ? file.type.startsWith('image/')
      : file.type.startsWith('video/');

    if (isCorrectType) {
      onFileSelect(file);
    } else {
      alert(`Veuillez sélectionner un fichier ${type}`);
    }
  };

  return (
    <Box
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed',
        borderColor: dragActive ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        bgcolor: dragActive ? 'action.hover' : 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={type === 'image' ? 'image/*' : 'video/*'}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      
      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
      
      <Typography variant="body1" gutterBottom>
        Glissez-déposez votre {type === 'image' ? 'image' : 'vidéo'} ici
      </Typography>
      
      <Typography variant="body2" color="text.secondary">
        ou cliquez pour sélectionner un fichier
      </Typography>
      
      <Button
        variant="outlined"
        size="small"
        sx={{ mt: 2 }}
        onClick={(e) => {
          e.stopPropagation();
          onFileSelect(null);
        }}
      >
        Annuler
      </Button>
    </Box>
  );
}
