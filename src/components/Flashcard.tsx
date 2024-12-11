import { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Skeleton,
  Box,
  LinearProgress,
  Link
} from '@mui/material';
import type { Question } from '../types/database';
import { useImageCache } from '../hooks/useImageCache';
import './Flashcard.css';

interface FlashcardProps {
  question: Question;
  nextQuestions: Question[];
  onAnswer: (answer: string) => void;
  onNextQuestion: () => void;
  timeLeft: number;
  maxTime: number;
  showingAnswer: boolean;
  currentScore: number;
  onBoosterUse: (type: 'fiftyFifty' | 'showAnswer' | 'articleLink') => boolean;
  boosters: {
    fiftyFifty: number;
    showAnswer: number;
    articleLink: number;
  };
}

export default function Flashcard({ 
  question, 
  nextQuestions,
  onAnswer, 
  onNextQuestion,
  timeLeft: initialTimeLeft, 
  maxTime, 
  showingAnswer,
  currentScore,
  onBoosterUse,
  boosters
}: FlashcardProps) {
  const { getCachedImage, preloadImages } = useImageCache();
  const [isFlipped, setIsFlipped] = useState(showingAnswer);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [canFlip, setCanFlip] = useState(showingAnswer);
  const [showTimer, setShowTimer] = useState(!showingAnswer && maxTime > 0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [isAnswerValidated, setIsAnswerValidated] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [showArticleLink, setShowArticleLink] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionCache = useRef<Map<string, Question>>(new Map());

  useEffect(() => {
    // Cache the current question
    if (question?.id) {
      questionCache.current.set(String(question.id), question);
    }

    // Cache the next questions
    nextQuestions.forEach(q => {
      if (q?.id) {
        questionCache.current.set(String(q.id), q);
      }
    });

    setFilteredOptions(question.options);
  }, [question, nextQuestions]);

  useEffect(() => {
    setIsFlipped(showingAnswer);
    setCanFlip(showingAnswer);
    if (onBoosterUse('articleLink') && question?.feedback) {
      setShowTimer(!showingAnswer && maxTime > 0);
    }
  }, [showingAnswer, maxTime]);

  useEffect(() => {
    const loadImage = async () => {
      if (question.image_url) {
        setIsImageLoading(true);
        setImageError(false);
        try {
          console.log('[Flashcard] Chargement de l\'image:', question.image_url);
          const cachedUrl = await getCachedImage(question.image_url);
          if (cachedUrl) {
            setImageUrl(cachedUrl);
            setImageError(false);
          } else {
            console.error('[Flashcard] Image non trouvée:', question.image_url);
            setImageError(true);
          }
        } catch (error) {
          console.error('[Flashcard] Erreur de chargement:', error);
          setImageError(true);
        } finally {
          setIsImageLoading(false);
        }
      } else {
        setImageUrl(null);
        setImageError(false);
      }
    };

    loadImage();

    // Précharger les images des prochaines questions
    if (nextQuestions.length > 0) {
      const nextImages = nextQuestions
        .slice(0, 3) // Précharger les 3 prochaines questions
        .map(q => q.image_url)
        .filter((url): url is string => url !== null);

      if (nextImages.length > 0) {
        console.log('[Flashcard] Préchargement des prochaines images:', nextImages);
        preloadImages(nextImages).catch(error => {
          console.error('[Flashcard] Erreur de préchargement:', error);
        });
      }
    }
  }, [question.image_url, getCachedImage, preloadImages, nextQuestions]);

  useEffect(() => {
    if (nextQuestions.length > 0) {
      const imagesToPreload = nextQuestions
        .filter(q => q.image_url)
        .map(q => q.image_url as string);
      
      if (imagesToPreload.length > 0) {
        preloadImages(imagesToPreload);
      }
    }
  }, [nextQuestions]);

  useEffect(() => {
    if (showTimer && timeLeft > 0 && !isFlipped && maxTime > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            handleValidate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [showTimer, isFlipped, maxTime]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setShowTimer(false);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleValidate = () => {
    if (selectedAnswer || timeLeft <= 0) {
      stopTimer();
      const correct = selectedAnswer ? question.correct_answers.includes(selectedAnswer) : false;
      setIsCorrect(correct);
      setIsFlipped(true);
      setCanFlip(false);  
      setIsAnswerValidated(true);  
      if (correct) {
        onAnswer(String(selectedAnswer || ''));
      }
    }
  };

  const handleCardClick = () => {
    if (canFlip && !isAnswerValidated) {  
      setIsFlipped(!isFlipped);
    }
  };

  const handleNextQuestion = () => {
    onNextQuestion();
    setIsFlipped(false);
    setSelectedAnswer(null);
    setCanFlip(false);
    setShowTimer(true);
    setIsCorrect(false);
    setTimeLeft(maxTime);
    setIsAnswerValidated(false);  
    stopTimer();
  };

  const handleFiftyFifty = () => {
    if (onBoosterUse('fiftyFifty') && question?.options && question?.correct_answers) {
      // Get incorrect answers
      const incorrectAnswers = question.options.filter(
        option => !question.correct_answers.includes(option)
      );
      
      // Randomly select two incorrect answers to remove
      const shuffled = incorrectAnswers.sort(() => 0.5 - Math.random());
      const toRemove = shuffled.slice(0, 2);
      
      // Filter options to keep correct answers and remove selected incorrect ones
      const newOptions = question.options.filter(
        option => question.correct_answers.includes(option) || !toRemove.includes(option)
      );
      
      setFilteredOptions(newOptions);
    }
  };

  const handleShowAnswer = () => {
    if (onBoosterUse('showAnswer') && question?.correct_answers) {
      setFilteredOptions(question.correct_answers);
    }
  };

  const handleArticleLink = () => {
    if (onBoosterUse('articleLink') && question?.feedback) {
      setShowArticleLink(true);
    }
  };

  const progress = (maxTime - timeLeft) / maxTime * 100;

  // TODO: You can use currentScore here if needed, e.g., for displaying current score
  console.log(`Current Score: ${currentScore}`);

  return (
    <Box>
      <div className="flashcard-container">
        {/* Add booster display section */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFiftyFifty();
            }}
            disabled={boosters.fiftyFifty <= 0 || isFlipped}
            className="booster-button"
          >
            50:50 ({boosters.fiftyFifty})
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShowAnswer();
            }}
            disabled={boosters.showAnswer <= 0 || isFlipped}
            className="booster-button"
          >
            Show Answer ({boosters.showAnswer})
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleArticleLink();
            }}
            disabled={boosters.articleLink <= 0 || isFlipped || !question.feedback}
            className="booster-button"
          >
            Article Link ({boosters.articleLink})
          </button>
        </Box>
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
          <div className="flashcard-inner">
            {/* Face avant */}
            <Box className="flashcard-front">
              <Typography className="question-text">
                {question.question}
              </Typography>

              {/* Image de la question */}
              {question.image_url && (
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    mb: 2,
                    position: 'relative',
                    backgroundColor: 'grey.100',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {isImageLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={200} />
                  ) : imageError ? (
                    <Typography color="error">Erreur de chargement de l'image</Typography>
                  ) : imageUrl ? (
                    <Box
                      component="img"
                      src={imageUrl}
                      alt="Question"
                      sx={{
                        maxWidth: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  ) : null}
                </Box>
              )}

              {/* Options de réponse */}
              <div className="answer-options">
                {filteredOptions.map((answer, index) => (
                  <button
                    key={index}
                    className={`answer-option ${selectedAnswer === answer ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAnswerSelect(answer);
                    }}
                    disabled={isFlipped}
                  >
                    <span className="answer-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="answer-text">{answer}</span>
                  </button>
                ))}
              </div>

              {showArticleLink && question.feedback && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Link href={question.feedback} target="_blank" rel="noopener noreferrer">
                    Voir l'article lié à cette question
                  </Link>
                </Box>
              )}

              <button
                className="validate-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleValidate();
                }}
                disabled={!selectedAnswer || isFlipped}
              >
                Valider ma réponse
              </button>
            </Box>

            {/* Face arrière */}
            <div className="flashcard-back">
              <div className="answer-display">
                <Typography variant="h4" style={{ color: isCorrect ? '#4caf50' : '#f44336', marginBottom: '1rem' }}>
                  {isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}
                </Typography>
                <Typography variant="h6">
                  La bonne réponse était : {question.correct_answers.join(' ou ')}
                </Typography>
              </div>

              {question.feedback && (
                <div className="feedback">
                  <Typography>{question.feedback}</Typography>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextQuestion();
                }}
                className="next-button"
              >
                Question suivante
              </button>

              <Typography variant="caption" className="flip-hint">
                {isAnswerValidated ? 'Cliquez sur "Question suivante" pour continuer' : 'Cliquez n\'importe où pour retourner la carte'}
              </Typography>
            </div>
          </div>
        </div>
      </div>
      {showTimer && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 10, 
            borderRadius: 5, 
            backgroundColor: 'lightgray',
            '& .MuiLinearProgress-bar': {
              backgroundColor: progress < 20 ? 'red' : progress < 50 ? 'orange' : 'green'
            }
          }} 
        />
      )}
    </Box>
  );
}
