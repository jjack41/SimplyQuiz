// Configuration de l'API
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://57.129.80.78',
    ENDPOINTS: {
        UPLOAD: '/api/upload',
        DELETE_MEDIA: '/api/delete-media'
    }
};
