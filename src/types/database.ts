export type QuestionType = 'qcm' | 'qru' | 'vf' | 'video';
export type Level = 'facile' | 'moyen' | 'difficile';

export interface Category {
  id: string
  name: string
  color: string
  description?: string
  user_id: string
  created_at: string
}

export interface Question {
  id: number
  question: string
  type: QuestionType
  category_id: number
  level: Level
  options: string[]
  correct_answers: string[]
  correct_answer: string
  image_url: string | null
  video_url: string | null
  start_time: number | null
  end_time: number | null
  feedback: string | null
  feedback_media_url: string | null
  url: string | null
  user_id: string
  created_at: string
  category_name?: string
  score?: number
}
