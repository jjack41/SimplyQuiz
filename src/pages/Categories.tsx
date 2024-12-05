import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import type { Category } from '../types/database';

export default function Categories() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2196f3');
  const [error, setError] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      console.log('Chargement des catégories pour user_id:', user?.id);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Résultat du chargement:', { data, error });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des catégories:', err);
      setError('Erreur lors du chargement des catégories: ' + err.message);
    }
  };

  const handleOpen = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setColor(category.color);
    } else {
      setEditingCategory(null);
      setName('');
      setColor('#2196f3');
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setName('');
    setColor('#2196f3');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Le nom de la catégorie est requis');
      return;
    }

    if (!user?.id) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ 
            name: trimmedName, 
            color 
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const newCategory = {
          name: trimmedName,
          color,
          user_id: user.id
        };
        
        const { error, data } = await supabase
          .from('categories')
          .insert(newCategory)
          .select()
          .single();

        if (error) {
          console.error('Erreur d\'insertion:', error);
          throw error;
        }
        
        console.log('Catégorie créée avec succès:', data);
      }

      await loadCategories();
      handleClose();
    } catch (err: any) {
      const errorMessage = err.message || 'Une erreur est survenue lors de la création de la catégorie';
      console.error('Erreur:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);

        if (error) throw error;
        loadCategories();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleStartGame = () => {
    if (selectedCategories.length === 0) {
      setError('Veuillez sélectionner au moins une catégorie');
      return;
    }
    navigate('/game-classique', {
      state: {
        categories: selectedCategories,
        questionCount: 10
      }
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">Catégories</Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartGame}
            disabled={selectedCategories.length === 0}
            sx={{ mr: 2 }}
          >
            Commencer le Quiz
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Nouvelle Catégorie
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                border: selectedCategories.includes(String(category.id)) ? '2px solid #2196f3' : 'none'
              }}
              onClick={() => {
                console.log('Category ID type:', typeof category.id);
                console.log('Category ID:', category.id);
                handleCategorySelect(String(category.id));
              }}
            >
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h6" component="div">
                    {category.name}
                  </Typography>
                  <Box>
                    <Checkbox
                      checked={selectedCategories.includes(String(category.id))}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCategorySelect(String(category.id));
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen(category);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(Number(category.id));
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 1,
                    bgcolor: category.color,
                    mt: 1
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle>
          {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom de la catégorie"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            <Button
              onClick={() => setShowColorPicker(!showColorPicker)}
              variant="outlined"
              sx={{ mb: 2 }}
            >
              Choisir une couleur
            </Button>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 1,
                bgcolor: color,
                ml: 2,
                display: 'inline-block'
              }}
            />
            {showColorPicker && (
              <Box sx={{ mt: 2 }}>
                <ChromePicker
                  color={color}
                  onChange={(color) => setColor(color.hex)}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCategory ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
