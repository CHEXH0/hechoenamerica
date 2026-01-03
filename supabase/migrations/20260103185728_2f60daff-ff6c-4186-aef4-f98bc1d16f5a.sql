-- Create a table to track AI song generations per user
CREATE TABLE public.ai_song_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  genre TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_song_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own generations
CREATE POLICY "Users can view their own AI generations" 
ON public.ai_song_generations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own generations
CREATE POLICY "Users can create their own AI generations" 
ON public.ai_song_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create an index for efficient querying by user and date
CREATE INDEX idx_ai_song_generations_user_date 
ON public.ai_song_generations (user_id, created_at DESC);