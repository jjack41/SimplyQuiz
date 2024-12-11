import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

// Configuration de CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Middleware pour gérer les erreurs CORS préflight
app.options('*', cors());

// Middleware pour parser le JSON
app.use(express.json());

// Servir les fichiers statiques du dossier media
app.use('/media', express.static(path.join(__dirname, '../public/media')));

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mediaDir = path.join(__dirname, '../public/media');
    console.log('[Server] Dossier de destination:', mediaDir);
    
    try {
      // Créer le dossier media s'il n'existe pas
      fs.mkdirSync(mediaDir, { recursive: true });
      console.log('[Server] Dossier media prêt');
      cb(null, mediaDir);
    } catch (error) {
      console.error('[Server] Erreur création dossier:', error);
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
    const fileName = `${timestamp}-${originalName}`;
    console.log('[Server] Nom fichier généré:', fileName);
    cb(null, fileName);
  }
});

const upload = multer({ storage });

// Route pour l'upload de fichiers
app.post('/api/upload', (req, res) => {
  console.log('[Server] Début upload');
  
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('[Server] Erreur multer:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!req.file) {
      console.error('[Server] Pas de fichier');
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }

    try {
      console.log('[Server] Fichier reçu:', req.file);
      const relativePath = `/media/${req.file.filename}`;
      res.json({ path: relativePath });
    } catch (error) {
      console.error('[Server] Erreur traitement:', error);
      res.status(500).json({ error: 'Erreur traitement fichier' });
    }
  });
});

// Route pour la suppression de fichiers
app.delete('/api/delete-media', (req, res) => {
  try {
    console.log('[Server] Requête de suppression reçue:', req.query);

    const filePath = req.query.path as string;
    if (!filePath) {
      console.error('[Server] Chemin de fichier manquant');
      return res.status(400).json({ error: 'Chemin de fichier non spécifié' });
    }

    // Nettoyer et valider le nom du fichier
    const fileName = decodeURIComponent(filePath).split('/').pop();
    if (!fileName) {
      console.error('[Server] Nom de fichier invalide:', filePath);
      return res.status(400).json({ error: 'Nom de fichier invalide' });
    }

    // Construire le chemin complet
    const fullPath = path.join(__dirname, '../public/media', fileName);
    console.log('[Server] Tentative de suppression:', {
      requestPath: filePath,
      fileName: fileName,
      fullPath: fullPath
    });

    // Vérifier que le chemin est sécurisé
    const mediaDir = path.join(__dirname, '../public/media');
    if (!fullPath.startsWith(mediaDir)) {
      console.error('[Server] Tentative d\'accès non autorisé:', fullPath);
      return res.status(403).json({ error: 'Chemin non autorisé' });
    }

    // Vérifier l'existence et supprimer le fichier
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('[Server] Fichier supprimé avec succès:', fileName);
      res.json({ success: true, message: 'Fichier supprimé avec succès' });
    } else {
      console.log('[Server] Fichier non trouvé:', fileName);
      res.status(404).json({ error: 'Fichier non trouvé', fileName: fileName });
    }
  } catch (error) {
    console.error('[Server] Erreur lors de la suppression:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du fichier',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Servir les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, '../public')));

app.listen(port, () => {
  console.log(`[Server] Serveur démarré sur le port ${port}`);
  console.log(`[Server] Dossier public: ${path.join(__dirname, '../public')}`);
  console.log(`[Server] Mode: ${process.env.NODE_ENV || 'development'}`);
});
