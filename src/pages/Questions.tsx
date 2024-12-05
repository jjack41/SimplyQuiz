import { mediaDB } from '../services/mediaDB';import { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Question, QuestionType, Category } from '../types/database';
import ImageSelector from '../components/ImageSelector';
import toast from 'react-hot-toast';

interface FormData {
  question: string;
  type: QuestionType;
  category_id: string;
  options: string[];
  correct_answers: string[];
  correct_answer: string;
  image_url: string | null;
  video_url: string | null;
  start_time: number;
  end_time: number;
  feedback: string;
  feedback_media_url: string | null;
  url: string;
}

interface Filters {
  category_id: string;
  type: QuestionType | '';
}

export default function Questions() {
  const { user } = useAuthContext();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    category_id: '',
    type: ''
  });
  const [formData, setFormData] = useState<FormData>({
    question: '',
    type: 'qcm',
    category_id: '',
    options: ['', '', '', ''],
    correct_answers: [],
    correct_answer: '',
    image_url: null,
    video_url: null,
    start_time: 0,
    end_time: 0,
    feedback: '',
    feedback_media_url: null,
    url: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadQuestions();
      loadCategories();
    }
  }, [user]);

  useEffect(() => {
    filterQuestions();
  }, [questions, filters]);

  const filterQuestions = () => {
    let filtered = [...questions];
    
    if (filters.category_id) {
      filtered = filtered.filter(q => q.category_id.toString() === filters.category_id);
    }
    if (filters.type) {
      filtered = filtered.filter(q => q.type === filters.type);
    }

    setFilteredQuestions(filtered);
  };

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des questions:', error);
        setError('Erreur lors du chargement des questions');
        return;
      }

      setQuestions(data || []);
    } catch (err) {
      console.error('Exception lors du chargement des questions:', err);
      setError('Une erreur est survenue');
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user?.id);

    if (error) {
      setError('Erreur lors du chargement des catégories');
    } else {
      setCategories(data || []);
    }
  };

  const handleOpen = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        question: question.question,
        type: question.type,
        category_id: question.category_id.toString(),
        options: question.options || ['', '', '', ''],
        correct_answers: question.correct_answers || [],
        correct_answer: question.correct_answer || '',
        image_url: question.image_url,
        video_url: question.video_url,
        start_time: question.start_time ?? 0,
        end_time: question.end_time ?? 0,
        feedback: question.feedback || '',
        feedback_media_url: question.feedback_media_url,
        url: question.url || ''
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        question: '',
        type: 'qcm',
        category_id: '',
        options: ['', '', '', ''],
        correct_answers: [],
        correct_answer: '',
        image_url: null,
        video_url: null,
        start_time: 0,
        end_time: 0,
        feedback: '',
        feedback_media_url: null,
        url: ''
      });
    }
    setOpenDialog(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleCorrectAnswerChange = (option: string) => {
    if (formData.type === 'qcm') {
      const newCorrectAnswers = formData.correct_answers.includes(option)
        ? formData.correct_answers.filter(answer => answer !== option)
        : [...formData.correct_answers, option];
      setFormData({ ...formData, correct_answers: newCorrectAnswers });
    } else if (formData.type === 'qru') {
      setFormData({ ...formData, correct_answer: option });
    }
  };

  const renderQuestionForm = () => {
    switch (formData.type) {
      case 'qcm':
      case 'qru':
      case 'vf':
      case 'video':
        return (
          <Box>
            <ImageSelector
              questionId={editingQuestion?.id?.toString() || 'new'}
              currentImage={formData.image_url}
              onImageChange={(url) => setFormData({ ...formData, image_url: url })}
            />

            {formData.type === 'qcm' && (
              <Box>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Options</Typography>
                {formData.options.map((option, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.correct_answers.includes(option)}
                          onChange={() => handleCorrectAnswerChange(option)}
                        />
                      }
                      label="Correcte"
                    />
                  </Box>
                ))}
              </Box>
            )}

            {formData.type === 'qru' && (
              <Box>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Options</Typography>
                <RadioGroup value={formData.correct_answer}>
                  {formData.options.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <TextField
                        fullWidth
                        label={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                      />
                      <Radio
                        value={option}
                        onChange={() => handleCorrectAnswerChange(option)}
                      />
                    </Box>
                  ))}
                </RadioGroup>
              </Box>
            )}

            {formData.type === 'vf' && (
              <Box sx={{ mt: 2 }}>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="Vrai" />
                    <FormControlLabel value="false" control={<Radio />} label="Faux" />
                  </RadioGroup>
                </FormControl>
              </Box>
            )}

            {formData.type === 'video' && (
              <Box>
                <TextField
                  fullWidth
                  label="URL de la vidéo"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  sx={{ mb: 2 }}
                />
                {formData.video_url && (
                  <Box sx={{ mb: 2 }}>
                    <video
                      src={formData.video_url}
                      controls
                      style={{ width: '100%', maxHeight: 300 }}
                    />
                  </Box>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Temps de début (secondes)"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Temps de fin (secondes)"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: Number(e.target.value) })}
                    />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  label="Réponse correcte"
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  sx={{ mt: 2 }}
                />
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Feedback et ressources supplémentaires
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Feedback"
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Média du feedback
                </Typography>
                <ImageSelector
                  questionId={`${editingQuestion?.id || 'new'}-feedback`}
                  currentImage={formData.feedback_media_url}
                  onImageChange={(url) => setFormData({ ...formData, feedback_media_url: url })}
                />
              </Box>

              <TextField
                fullWidth
                label="URL de ressource"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                sx={{ mb: 2 }}
              />
            </Box>
          </Box>
        );
    }
  };

  const handleSubmit = async () => {
    if (!formData.question.trim() || !formData.category_id) {
      setError('Tous les champs sont requis');
      return;
    }

    try {
      const dataToSave = {
        question: formData.question.trim(),
        type: formData.type,
        category_id: parseInt(formData.category_id),
        options: formData.type === 'qcm' ? formData.options.filter(opt => opt.trim() !== '') : [],
        correct_answers: formData.type === 'qcm' ? formData.correct_answers : [],
        correct_answer: formData.type === 'qcm' ? '' : formData.correct_answer.trim(),
        image_url: formData.image_url,
        video_url: formData.video_url,
        start_time: formData.type === 'video' ? formData.start_time : null,
        end_time: formData.type === 'video' ? formData.end_time : null,
        feedback: formData.feedback.trim() || null,
        feedback_media_url: formData.feedback_media_url || null,
        url: formData.url.trim() || null
      };

      let result;
      if (editingQuestion) {
        result = await supabase
          .from('questions')
          .update(dataToSave)
          .eq('id', editingQuestion.id)
          .select();

        if (result.error) throw result.error;
      } else {
        result = await supabase
          .from('questions')
          .insert([dataToSave])
          .select();

        if (result.error) throw result.error;
      }

      handleClose();
      loadQuestions();
      // Afficher un message de succès
      toast.success(editingQuestion ? 'Question mise à jour avec succès' : 'Question créée avec succès');
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.message);
      toast.error('Erreur lors de la sauvegarde: ' + err.message);
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingQuestion(null);
    setError('');
  };

  const handleDelete = async (questionId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      try {
        // Récupérer la question pour obtenir les URLs des médias
        const { data: question, error: fetchError } = await supabase
          .from('questions')
          .select('image_url, feedback_media_url')
          .eq('id', questionId)
          .single();

        if (fetchError) throw fetchError;

        // Supprimer les médias de IndexedDB et du dossier public/media
        if (question) {
          const mediaToDelete = [
            question.image_url,
            question.feedback_media_url
          ].filter(url => url !== null);

          for (const mediaUrl of mediaToDelete) {
            try {
              // Supprimer de IndexedDB
              await mediaDB.delete(mediaUrl!);
              
              // Supprimer le fichier du dossier public/media
              const fileName = mediaUrl!.split('/').pop();
              if (fileName) {
                await fetch(`http://localhost:3002/api/delete-media?path=media/${fileName}`, {
                  method: 'DELETE'
                });
              }
            } catch (err) {
              console.error('Erreur lors de la suppression du média:', err);
            }
          }
        }

        // Supprimer la question de la base de données
        const { error } = await supabase
          .from('questions')
          .delete()
          .eq('id', questionId);

        if (error) throw error;
        loadQuestions();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleDuplicate = async (question: Question) => {
    try {
      const { id, created_at, ...questionData } = question;
      const { error } = await supabase
        .from('questions')
        .insert([{
          ...questionData,
          question: `${question.question} (copie)`,
        }]);

      if (error) throw error;
      loadQuestions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedQuestions.length} questions ?`)) {
      try {
        // Récupérer les questions pour obtenir les URLs des médias
        const { data: questions, error: fetchError } = await supabase
          .from('questions')
          .select('image_url, feedback_media_url')
          .in('id', selectedQuestions.map(id => parseInt(id)));

        if (fetchError) throw fetchError;

        // Supprimer les médias de IndexedDB et du dossier public/media
        if (questions) {
          const mediaToDelete = questions.flatMap(question => 
            [question.image_url, question.feedback_media_url].filter(url => url !== null)
          );

          for (const mediaUrl of mediaToDelete) {
            try {
              // Supprimer de IndexedDB
              await mediaDB.delete(mediaUrl!);
              
              // Supprimer le fichier du dossier public/media
              const fileName = mediaUrl!.split('/').pop();
              if (fileName) {
                await fetch(`http://localhost:3002/api/delete-media?path=media/${fileName}`, {
                  method: 'DELETE'
                });
              }
            } catch (err) {
              console.error('Erreur lors de la suppression du média:', err);
            }
          }
        }

        // Supprimer les questions de la base de données
        const { error } = await supabase
          .from('questions')
          .delete()
          .in('id', selectedQuestions.map(id => parseInt(id)));

        if (error) throw error;
        setSelectedQuestions([]);
        loadQuestions();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const toggleQuestionSelection = (questionId: number) => {
    setSelectedQuestions(prev =>
      prev.includes(String(questionId))
        ? prev.filter(id => id !== String(questionId))
        : [...prev, String(questionId)]
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Questions
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{ mb: 3 }}
        >
          Nouvelle question
        </Button>

        {selectedQuestions.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteSelected}
            sx={{ ml: 2, mb: 3 }}
          >
            Supprimer la sélection ({selectedQuestions.length})
          </Button>
        )}

        {/* Filtres */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={filters.category_id}
              label="Catégorie"
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            >
              <MenuItem value="">Toutes</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) => setFilters({ ...filters, type: e.target.value as QuestionType | '' })}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="qcm">QCM</MenuItem>
              <MenuItem value="qru">QRU</MenuItem>
              <MenuItem value="vf">Vrai/Faux</MenuItem>
              <MenuItem value="video">Vidéo</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Dialog open={openDialog} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Type de question</InputLabel>
                    <Select
                      value={formData.type}
                      label="Type de question"
                      onChange={(e) => setFormData({
                        ...formData,
                        type: e.target.value as QuestionType,
                        correct_answers: [],
                        correct_answer: '',
                      })}
                    >
                      <MenuItem value="qcm">Choix multiples (QCM)</MenuItem>
                      <MenuItem value="qru">Réponse unique (QRU)</MenuItem>
                      <MenuItem value="vf">Vrai/Faux</MenuItem>
                      <MenuItem value="video">Question vidéo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Catégorie</InputLabel>
                    <Select
                      value={formData.category_id}
                      label="Catégorie"
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  />
                </Grid>
              </Grid>

              {renderQuestionForm()}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingQuestion ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </Dialog>

        <Grid container spacing={2}>
          {filteredQuestions.map((question) => {
            const category = categories.find(c => Number(c.id) === question.category_id);
            return (
              <Grid item xs={12} sm={6} md={3} key={question.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderLeft: `6px solid ${category?.color || '#ccc'}`,
                    borderRadius: '4px',
                    '& .MuiCardContent-root': {
                      flexGrow: 1,
                      pl: 2
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Checkbox
                        checked={selectedQuestions.includes(String(question.id))}
                        onChange={() => toggleQuestionSelection(question.id)}
                      />
                      <Typography variant="h6" component="div" sx={{ fontSize: '1rem', flexGrow: 1 }}>
                        {question.question}
                      </Typography>
                    </Box>
                    
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Type: {question.type === 'qcm' ? 'QCM' :
                            question.type === 'qru' ? 'QRU' :
                            question.type === 'vf' ? 'Vrai/Faux' :
                            question.type === 'video' ? 'Vidéo' : 'Texte'}
                    </Typography>
                    
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Catégorie: {category?.name}
                    </Typography>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start', gap: 1 }}>
                      <IconButton size="small" onClick={() => handleOpen(question)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDuplicate(question)}>
                        <DuplicateIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(question.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Container>
  );
}
