-- Supabase Schema for AI Health Analyses
-- Run this in your Supabase SQL Editor

CREATE TABLE public.health_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    zones TEXT[] NOT NULL,
    symptoms_description TEXT NOT NULL,
    probable_causes JSONB NOT NULL,
    action_plan JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.health_analyses ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own health analyses"
    ON public.health_analyses
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health analyses"
    ON public.health_analyses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health analyses"
    ON public.health_analyses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health analyses"
    ON public.health_analyses
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_health_analyses_modtime
    BEFORE UPDATE ON public.health_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
