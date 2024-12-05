import { Box } from '@mui/material';

interface MediaPreviewProps {
  file: File | null;
  type: 'image' | 'video';
}

export default function MediaPreview({ file, type }: MediaPreviewProps) {
  if (!file) return null;

  const url = URL.createObjectURL(file);

  return (
    <Box
      sx={{
        mt: 2,
        maxWidth: '100%',
        maxHeight: 300,
        overflow: 'hidden',
        borderRadius: 1,
      }}
    >
      {type === 'image' ? (
        <img
          src={url}
          alt="Preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          onLoad={() => URL.revokeObjectURL(url)}
        />
      ) : (
        <video
          src={url}
          controls
          style={{
            width: '100%',
            maxHeight: 300,
          }}
          onLoadedData={() => URL.revokeObjectURL(url)}
        />
      )}
    </Box>
  );
}
