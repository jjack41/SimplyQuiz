export type QuestionType = 'qru' | 'qcm' | 'vf' | 'video';
export type Level = 'facile' | 'moyen' | 'difficile';
export type MediaType = 'none' | 'image' | 'video';

// Interface de base pour les médias
export interface Media {
  type: MediaType;
  url?: string;
}

// Interface de base pour le feedback
export interface Feedback {
  text?: string;
  media?: Media;
}

// Interface de base pour toutes les questions
export interface BaseQuestion {
  id: number;
  question: string;
  type: QuestionType;
  category_id: number;
  category_name?: string;
  image_url?: string | null;
  video_url?: string | null;
  start_time?: number | null;
  end_time?: number | null;
  feedback?: string | null;
  feedback_media_url?: string | null;
  url?: string | null;
  user_id: string;
  created_at?: string;
}

// Question à Réponse Unique (QRU)
export interface QRUQuestion extends BaseQuestion {
  type: 'qru';
  options: string[];
  correctAnswer: string;
}

// Question à Choix Multiples (QCM)
export interface QCMQuestion extends BaseQuestion {
  type: 'qcm';
  options: string[];
  correctAnswers: string[];
}

// Question Vrai/Faux
export interface VFQuestion extends BaseQuestion {
  type: 'vf';
  correctAnswer: boolean;
}

// Question Vidéo
export interface VideoQuestion extends BaseQuestion {
  type: 'video';
  videoUrl: string;
  correctAnswer: string;
  startTime?: number;
  endTime?: number;
}

// Type union pour tous les types de questions
export type Question = QRUQuestion | QCMQuestion | VFQuestion | VideoQuestion;

// Type pour la validation des réponses
export interface AnswerValidation {
  isCorrect: boolean;
  feedback?: Feedback;
  score?: number;
}

// Type pour les réponses des utilisateurs
export interface UserAnswer {
  questionId: string;
  answer: string | string[] | boolean;
  timestamp: string;
}
