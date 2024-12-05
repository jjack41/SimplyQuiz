import { Container } from '@mui/material';
import RoueChance from '../components/RoueChance';

export default function RouePage() {
  const handleClose = () => {
    // Gérer la fermeture (par exemple, navigation)
    console.log("Fermeture de la roue");
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <RoueChance onClose={handleClose} />
    </Container>
  );
}