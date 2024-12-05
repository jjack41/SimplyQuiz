const path = require('path');

module.exports = {
  entry: './src/index.js', // Point d'entrée de votre application
  output: {
    path: path.resolve(__dirname, 'dist'), // Répertoire de sortie
    filename: 'bundle.js' // Nom du fichier de sortie
  },
  // Ajoutez d'autres configurations selon vos besoins
};