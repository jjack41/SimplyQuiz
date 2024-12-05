import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

// Configuration de CORS
app.use(cors({
  origin: 'http://localhost:3000', // URL du client Vite
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Servir les fichiers statiques du dossier media
app.use('/media', express.static(path.join(__dirname, '../public/media')));

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mediaDir = path.join(__dirname, '../public/media');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    cb(null, mediaDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec le timestamp et le nom original du fichier
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, ''); // Nettoyer le nom du fichier
    const fileName = `${timestamp}-${originalName}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

// Route pour l'upload de fichiers
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier uploadé' });
  }

  const filePath = `/media/${req.file.filename}`;
  res.json({ path: filePath });
});

// Route pour la suppression de fichiers
app.delete('/api/delete-media', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    return res.status(400).json({ error: 'Chemin de fichier non spécifié' });
  }

  const fullPath = path.join(__dirname, '../public', filePath);
  
  // Vérifier que le chemin est bien dans le dossier media
  if (!fullPath.startsWith(path.join(__dirname, '../public/media'))) {
    return res.status(403).json({ error: 'Chemin non autorisé' });
  }

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Fichier non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du fichier' });
  }
});

// Servir les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, '../public')));

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
